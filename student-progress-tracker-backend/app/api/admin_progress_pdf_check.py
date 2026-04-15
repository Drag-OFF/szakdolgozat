"""
Admin PDF alapú "mi lenne ha" progress ellenőrzés.
Több PDF feltöltés, csak memóriafeldolgozás, DB írás nélkül.
"""

import re
import unicodedata

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import models
from app.db.database import get_db
from app.services.progress_pdf_simulation_service import (
    ProgressPdfSimulationService,
    _canonicalize_course_code,
    _compact_code,
)
from app.services.requirements_service import get_user_requirements, get_user_requirements_with_completed_courses
from app.utils.utils import admin_required

router = APIRouter()


def _credit_missing_rules_only(requirements_rows: list[dict]) -> list[dict]:
    """
    Admin PDF "mi lenne ha" nézethez csak kredites hiányok:
    hours/count (pl. practice, PE) ne keveredjen a kredites hiánylistába.
    """
    out: list[dict] = []
    for x in requirements_rows or []:
        missing = int(x.get("missing") or 0)
        value_type = str(x.get("value_type") or "").strip().lower()
        if missing <= 0:
            continue
        if value_type and value_type != "credits":
            continue
        out.append(
            {
                "code": x.get("code"),
                "label": x.get("label"),
                "missing": missing,
                "value_type": x.get("value_type"),
            }
        )
    return out


def _summary_credit_only(requirements_payload: dict | None) -> dict:
    """
    A kártyás összegzésben csak kredites hiány számítson.
    Hours/count szabályok ne torzítsák a "missing_total" értéket.
    """
    payload = requirements_payload or {}
    rows = payload.get("requirements") or []
    base = dict(payload.get("summary") or {})
    credit_missing_total = 0
    non_credit_missing_count = 0
    for r in rows:
        missing = int(r.get("missing") or 0)
        if missing <= 0:
            continue
        value_type = str(r.get("value_type") or "").strip().lower()
        if value_type and value_type != "credits":
            non_credit_missing_count += 1
            continue
        credit_missing_total += missing

    base["missing_total_all_rules"] = base.get("missing_total")
    base["missing_total"] = credit_missing_total
    base["missing_total_credit_only"] = credit_missing_total
    base["non_credit_missing_rules_count"] = non_credit_missing_count
    return base


def _resolve_completed_semester_for_import(
    db: Session,
    user: models.User,
    course_id: int,
    requested_semester: int | None,
) -> int:
    """
    A progress.completed_semester oszlop DB-ben kötelező lehet.
    Mentéskor mindig adunk érvényes (>=1) félévet:
    1) explicit kérésből,
    2) user szakjához tartozó ajánlott semester,
    3) bármelyik szakhoz tartozó legkisebb semester,
    4) fallback: 1
    """
    if requested_semester is not None:
        try:
            return max(1, int(requested_semester))
        except Exception:
            return 1

    sem = None
    if getattr(user, "major", None):
        row = (
            db.query(models.CourseMajor.semester)
            .join(models.Major, models.Major.id == models.CourseMajor.major_id)
            .filter(
                models.CourseMajor.course_id == int(course_id),
                models.Major.name == str(user.major),
            )
            .order_by(models.CourseMajor.semester.asc())
            .first()
        )
        if row and row[0] is not None:
            sem = row[0]
    if sem is None:
        row_any = (
            db.query(models.CourseMajor.semester)
            .filter(
                models.CourseMajor.course_id == int(course_id),
                models.CourseMajor.semester.isnot(None),
            )
            .order_by(models.CourseMajor.semester.asc())
            .first()
        )
        if row_any and row_any[0] is not None:
            sem = row_any[0]
    try:
        return max(1, int(sem if sem is not None else 1))
    except Exception:
        return 1


def _find_course_for_admin_upsert(db: Session, raw_code: str) -> models.Course | None:
    """
    Ugyanaz a logika, mint a PDF course lookup: pontos egyezés, majd kompakt kulcs
    (pl. XSH_FINAL-0003 vs XSH_FINAL0003).
    """
    canonical = _canonicalize_course_code(str(raw_code or "").strip())
    if not canonical:
        return None
    c = (
        db.query(models.Course)
        .filter(func.upper(models.Course.course_code) == canonical)
        .first()
    )
    if c:
        return c
    comp = _compact_code(canonical)
    if not comp:
        return None
    for row in db.query(models.Course).all():
        if _compact_code(str(row.course_code or "")) == comp:
            return row
    return None


class UpsertCourseMajorRequest(BaseModel):
    course_code: str
    name: str | None = None
    name_en: str | None = None
    major_id: int
    credit: int = 0
    semester: int = 1
    type: str = "required"
    subgroup: str | None = None


class RefreshHypotheticalRequest(BaseModel):
    """PDF újrafuttatása nélkül: mi-lenne-ha követelmények újraszámolása a kinyert, DB-hez párosított kurzus-ID-k alapján."""

    user_id: int
    pdf_resolved_course_ids: list[int]
    lang: str = "hu"


class ManualMatchAndRefreshRequest(BaseModel):
    user_id: int
    pdf_resolved_course_ids: list[int]
    lang: str = "hu"


class ManualMatchCandidatesRequest(BaseModel):
    user_name: str


def _canonical_full_name(s: str) -> str:
    return " ".join(str(s or "").strip().split()).lower()


def _normalize_name_for_match(s: str) -> str:
    t = unicodedata.normalize("NFKD", str(s or ""))
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    t = re.sub(r"[^\w\s-]", " ", t, flags=re.U)
    t = re.sub(r"[_\-]+", " ", t)
    t = re.sub(r"\s+", " ", t.strip().lower())
    return t


def _name_search_tokens(user_name: str) -> list[str]:
    """
    Szóköz szerint vágott tokenek (min. 2 karakter), hogy a sorrend és kisbetű
    ne számítson, de ne legyen túl laza egybetűs egyezés.
    """
    raw = _normalize_name_for_match(user_name)
    if not raw:
        return []
    parts = re.split(r"\s+", raw)
    out: list[str] = []
    for p in parts:
        if len(p) >= 2:
            out.append(p)
    return out


def _users_by_name_tokens(db: Session, user_name: str) -> list[dict]:
    """
    Minden tokennek szerepelnie kell a users.name mezőben (ILIKE részsztring).
    Nem automatikus „legjobb találat”: listából választ az admin (anyja neve alapján).
    """
    tokens = _name_search_tokens(user_name)
    if not tokens:
        raise HTTPException(status_code=400, detail="Legalább egy legalább 2 karakteres névrész szükséges.")

    rows = (
        db.query(models.User, models.Major.id.label("major_id"))
        .outerjoin(models.Major, models.Major.name == models.User.major)
        .order_by(models.User.name.asc(), models.User.id.asc())
        .all()
    )
    wanted = _canonical_full_name(user_name)
    wanted_tokens = set(tokens)
    out: list[dict] = []
    for u, mid in rows:
        user_tokens = set(_name_search_tokens(str(u.name or "")))
        if not wanted_tokens.issubset(user_tokens):
            continue
        out.append(
            {
                "id": int(u.id),
                "name": str(u.name or ""),
                "mothers_name": str(u.mothers_name or ""),
                "major": str(u.major or ""),
                "major_id": (int(mid) if mid is not None else None),
                "chosen_specialization_code": u.chosen_specialization_code,
                "birth_date": (u.birth_date.isoformat() if getattr(u, "birth_date", None) else None),
                "exact_name_match": bool(wanted and _canonical_full_name(u.name) == wanted),
            }
        )
    out.sort(key=lambda r: (0 if r.get("exact_name_match") else 1, str(r.get("name") or ""), int(r.get("id") or 0)))
    return out[:80]


@router.post("/progress/refresh-hypothetical")
def refresh_hypothetical(
    payload: RefreshHypotheticalRequest,
    _admin: dict = Depends(admin_required),
    db: Session = Depends(get_db),
):
    uid = int(payload.user_id or 0)
    if uid < 1:
        raise HTTPException(status_code=400, detail="user_id kötelező.")
    lang = payload.lang if payload.lang in ("hu", "en") else "hu"
    base_completed_rows = db.execute(
        text(
            """
            SELECT course_id
            FROM progress
            WHERE user_id = :uid AND status = 'completed'
            """
        ),
        {"uid": uid},
    ).fetchall()
    base_completed = {int(r[0]) for r in base_completed_rows}
    extra = {int(x) for x in (payload.pdf_resolved_course_ids or []) if int(x) > 0}
    hypothetical = set(base_completed) | extra
    after = get_user_requirements_with_completed_courses(uid, lang, db, hypothetical)
    after_rows = after.get("requirements") or []
    missing_rules = _credit_missing_rules_only(after_rows)
    return {
        "hypothetical_summary": _summary_credit_only(after),
        "diploma_ready_hypothetical": len(missing_rules) == 0,
        "missing_rules_hypothetical": missing_rules[:80],
    }


@router.post("/progress/manual-match-and-refresh")
def manual_match_and_refresh(
    payload: ManualMatchAndRefreshRequest,
    _admin: dict = Depends(admin_required),
    db: Session = Depends(get_db),
):
    lang = payload.lang if payload.lang in ("hu", "en") else "hu"
    uid = int(payload.user_id or 0)
    if uid < 1:
        raise HTTPException(status_code=400, detail="user_id kötelező.")
    row = (
        db.query(models.User, models.Major.id.label("major_id"))
        .outerjoin(models.Major, models.Major.name == models.User.major)
        .filter(models.User.id == uid)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="A megadott user nem található.")
    user, major_id = row

    uid = int(user.id)
    base_completed_rows = db.execute(
        text(
            """
            SELECT course_id
            FROM progress
            WHERE user_id = :uid AND status = 'completed'
            """
        ),
        {"uid": uid},
    ).fetchall()
    base_completed = {int(r[0]) for r in base_completed_rows}
    extra = {int(x) for x in (payload.pdf_resolved_course_ids or []) if int(x) > 0}
    hypothetical = set(base_completed) | extra

    before = get_user_requirements(uid, lang, db)
    after = get_user_requirements_with_completed_courses(uid, lang, db, hypothetical)
    after_rows = after.get("requirements") or []
    missing_rules = _credit_missing_rules_only(after_rows)

    return {
        "matched_user": {
            "id": uid,
            "name": str(user.name or ""),
            "mothers_name": str(user.mothers_name or ""),
            "major": str(user.major or ""),
            "major_id": major_id,
            "chosen_specialization_code": user.chosen_specialization_code,
            "birth_date": (user.birth_date.isoformat() if getattr(user, "birth_date", None) else None),
        },
        "baseline_summary": _summary_credit_only(before),
        "hypothetical_summary": _summary_credit_only(after),
        "diploma_ready_hypothetical": len(missing_rules) == 0,
        "missing_rules_hypothetical": missing_rules[:80],
    }


@router.post("/progress/manual-match-candidates")
def manual_match_candidates(
    payload: ManualMatchCandidatesRequest,
    _admin: dict = Depends(admin_required),
    db: Session = Depends(get_db),
):
    users = _users_by_name_tokens(db, payload.user_name)
    return {
        "ok": True,
        "query": str(payload.user_name or "").strip(),
        "candidates": users[:50],
    }


@router.post("/manual-match-candidates")
def manual_match_candidates_alias(
    payload: ManualMatchCandidatesRequest,
    _admin: dict = Depends(admin_required),
    db: Session = Depends(get_db),
):
    return manual_match_candidates(payload, _admin, db)


class PdfImportProgressRequest(BaseModel):
    """PDF szimulációból kinyert, DB-ben felismert kurzusok progress táblába írása."""

    user_id: int = Field(..., ge=1)
    course_ids: list[int] = Field(default_factory=list)
    status: str = Field(..., description="completed vagy in_progress")
    completed_semester: int | None = None
    points: int = 0
    skip_if_exists: bool = True


@router.post("/progress/import-from-pdf")
def import_progress_from_pdf_simulation(
    payload: PdfImportProgressRequest,
    _admin: dict = Depends(admin_required),
    db: Session = Depends(get_db),
):
    st = str(payload.status or "").strip().lower()
    if st not in ("completed", "in_progress", "pending"):
        raise HTTPException(status_code=400, detail="status csak completed, in_progress vagy pending lehet.")
    uid = int(payload.user_id)
    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="A megadott user nem található.")

    ids = [int(x) for x in (payload.course_ids or []) if int(x) > 0]
    ids = list(dict.fromkeys(ids))
    if not ids:
        raise HTTPException(status_code=400, detail="Legalább egy course_id szükséges.")

    existing_rows = (
        db.query(models.Progress)
        .filter(models.Progress.user_id == uid, models.Progress.course_id.in_(ids))
        .all()
    )
    by_course = {int(r.course_id): r for r in existing_rows}

    created = 0
    updated = 0
    skipped = 0
    missing_course = 0

    for cid in ids:
        c = db.query(models.Course).filter(models.Course.id == cid).first()
        if not c:
            missing_course += 1
            continue
        effective_semester = _resolve_completed_semester_for_import(
            db=db,
            user=user,
            course_id=cid,
            requested_semester=payload.completed_semester,
        )
        row = by_course.get(cid)
        if row:
            if payload.skip_if_exists:
                skipped += 1
                continue
            row.status = st
            row.completed_semester = effective_semester
            row.points = int(payload.points or 0)
            updated += 1
        else:
            db.add(
                models.Progress(
                    user_id=uid,
                    course_id=cid,
                    status=st,
                    completed_semester=effective_semester,
                    points=int(payload.points or 0),
                )
            )
            created += 1

    try:
        db.commit()
    except Exception as ex:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Progress mentés sikertelen: {ex}")

    return {
        "ok": True,
        "user_id": uid,
        "status": st,
        "created": created,
        "updated": updated,
        "skipped_existing": skipped,
        "missing_course": missing_course,
    }


@router.get("/progress/major-subgroups/{major_id}")
def list_major_subgroups(
    major_id: int,
    _admin: dict = Depends(admin_required),
    db: Session = Depends(get_db),
):
    if int(major_id) < 1:
        raise HTTPException(status_code=400, detail="major_id kötelező.")
    rows = (
        db.query(models.CourseMajor.subgroup)
        .filter(
            models.CourseMajor.major_id == int(major_id),
            models.CourseMajor.subgroup.isnot(None),
            models.CourseMajor.subgroup != "",
        )
        .distinct()
        .order_by(models.CourseMajor.subgroup.asc())
        .all()
    )
    return {"major_id": int(major_id), "subgroups": [str(r[0]) for r in rows if r and r[0]]}


@router.post("/progress/pdf-simulate")
async def progress_pdf_simulate(
    files: list[UploadFile] = File(...),
    lang: str = Form("hu"),
    _admin: dict = Depends(admin_required),
    db: Session = Depends(get_db),
):
    if not files:
        raise HTTPException(status_code=400, detail="Legalább egy PDF fájl szükséges.")
    payloads: list[tuple[str, bytes]] = []
    for f in files:
        fn = str(f.filename or "upload.pdf")
        if not fn.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"Csak PDF támogatott: {fn}")
        data = await f.read()
        if not data:
            continue
        payloads.append((fn, data))
    if not payloads:
        raise HTTPException(status_code=400, detail="A feltöltött fájlok üresek.")
    try:
        return ProgressPdfSimulationService(db).simulate(payloads, lang=lang if lang in ("hu", "en") else "hu")
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"PDF elemzés sikertelen: {ex}")


@router.post("/progress/upsert-course-major")
def upsert_course_major(
    payload: UpsertCourseMajorRequest,
    _admin: dict = Depends(admin_required),
    db: Session = Depends(get_db),
):
    try:
        cc = _canonicalize_course_code(str(payload.course_code or "").strip())
        if not cc:
            raise HTTPException(status_code=400, detail="course_code kötelező.")
        major_id = int(payload.major_id or 0)
        if major_id < 1:
            raise HTTPException(status_code=400, detail="major_id kötelező.")
        major_exists = db.query(models.Major.id).filter(models.Major.id == major_id).first()
        if not major_exists:
            raise HTTPException(status_code=400, detail=f"Ismeretlen major_id: {major_id}")

        course = _find_course_for_admin_upsert(db, payload.course_code)
        course_action = "updated"
        if not course:
            initial_name = str(payload.name or "").strip() or cc
            initial_name_en = (str(payload.name_en).strip() if payload.name_en is not None else None)
            course = models.Course(course_code=cc, name=initial_name, name_en=initial_name_en)
            db.add(course)
            db.flush()
            course_action = "created"
        if payload.name is not None:
            course.name = str(payload.name).strip() or course.name
        if payload.name_en is not None:
            course.name_en = str(payload.name_en).strip() or course.name_en
        if not course.name:
            course.name = cc

        subgroup = (str(payload.subgroup).strip() if payload.subgroup is not None else None)
        q = (
            db.query(models.CourseMajor)
            .filter(
                models.CourseMajor.course_id == int(course.id),
                models.CourseMajor.major_id == major_id,
            )
        )
        if subgroup:
            q = q.filter(models.CourseMajor.subgroup == subgroup)
        cm = q.first()
        cm_action = "updated"
        if not cm:
            cm = models.CourseMajor(
                course_id=int(course.id),
                major_id=major_id,
                credit=max(0, int(payload.credit or 0)),
                semester=max(1, int(payload.semester or 1)),
                type=str(payload.type or "required").strip() or "required",
                subgroup=subgroup,
            )
            db.add(cm)
            cm_action = "created"
        else:
            cm.credit = max(0, int(payload.credit or 0))
            cm.semester = max(1, int(payload.semester or 1))
            cm.type = str(payload.type or cm.type or "required").strip() or "required"
            cm.subgroup = subgroup
        db.commit()
        db.refresh(course)
        db.refresh(cm)
        return {
            "ok": True,
            "course_action": course_action,
            "course_id": int(course.id),
            "course_code": str(course.course_code),
            "course_name": str(course.name or ""),
            "course_major_action": cm_action,
            "course_major_id": int(cm.id),
        }
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as ex:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Adatbázis integritási hiba: {ex.orig}")
    except SQLAlchemyError as ex:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Adatbázis hiba: {ex}")
    except Exception as ex:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Mentési hiba: {ex}")

