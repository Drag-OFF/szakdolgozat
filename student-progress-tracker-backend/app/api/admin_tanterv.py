"""
Admin Neptun mintatanterv: URL/HTML import, előnézet, szerkesztői terv, snapshot visszagörgetés, BFS előnézet.

Védett végpontok: ``admin_required``. Nagy HTML feltöltés méretplafon: ``_HTML_UPLOAD_MAX_BYTES``.
"""

import asyncio

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.db.database import SessionLocal
from app.db import models
from app.services.neptun_tanterv_expand_service import expand_all_plus_nodes
from app.services.neptun_import_rollback_service import revert_import_snapshot, revert_latest_import_snapshot
from app.services.neptun_tanterv_import_service import (
    apply_import_editor_plan,
    build_import_editor_plan,
    import_from_url,
    import_html_string_to_db,
    parse_kod_from_url,
)
from app.services.neptun_tanterv_plan_service import create_plan, read_plan, mark_plan_applied
from app.utils.utils import admin_required

_HTML_UPLOAD_MAX_BYTES = 12 * 1024 * 1024

router = APIRouter()


def _import_from_url_thread(
    url: str,
    major_id: int,
    max_steps: int,
    create_rules: bool,
    dry_run: bool,
):
    db = SessionLocal()
    try:
        return import_from_url(
            db,
            url=url,
            major_id=major_id,
            max_steps=max_steps,
            create_rules=create_rules,
            dry_run=dry_run,
        )
    finally:
        db.close()


def _bytes_to_html_text(raw: bytes) -> str:
    if raw.startswith(b"\xef\xbb\xbf"):
        raw = raw[3:]
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw.decode("cp1250", errors="replace")


def _import_html_thread(
    html: str,
    major_id: int,
    create_rules: bool,
    dry_run: bool,
    kod_hint: str | None,
):
    db = SessionLocal()
    try:
        return import_html_string_to_db(
            db,
            html=html,
            major_id=major_id,
            create_rules=create_rules,
            dry_run=dry_run,
            kod_hint=kod_hint,
        )
    finally:
        db.close()


def _revert_import_thread(major_id: int, snapshot_id: str | None):
    db = SessionLocal()
    try:
        if snapshot_id:
            return revert_import_snapshot(db, snapshot_id=snapshot_id, major_id=major_id)
        return revert_latest_import_snapshot(db, major_id=major_id)
    finally:
        db.close()


class TantervExpandRequest(BaseModel):
    kod: str = Field(..., min_length=3, max_length=40, description="Neptun mintatanterv kód")
    max_steps: int = Field(1500, ge=1, le=5000)
    preview_chars: int = Field(80_000, ge=1000, le=500_000)


@router.post("/tanterv/expand-all")
async def tanterv_expand_all(
    payload: TantervExpandRequest,
    _admin: dict = Depends(admin_required),
):
    try:
        return await asyncio.to_thread(
            expand_all_plus_nodes,
            payload.kod,
            max_steps=payload.max_steps,
            preview_chars=payload.preview_chars,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Neptun lekérés sikertelen: {e}")


class TantervImportRequest(BaseModel):
    major_id: int = Field(..., ge=1)
    max_steps: int = Field(2000, ge=1, le=5000)
    url: str = Field(
        ...,
        min_length=24,
        max_length=2000,
        description="Teljes https://oktweb.neptun.u-szeged.hu/tanterv/…/tanterv.aspx?kod=… link",
    )
    create_rules: bool = Field(
        True,
        description="Hiányzó major_requirement_rules sorok létrehozása a Neptun blokk sorokból",
    )
    dry_run: bool = Field(False, description="True: semmi nem íródik DB-be, csak terv")


class TantervImportRevertRequest(BaseModel):
    major_id: int = Field(..., ge=1)
    snapshot_id: str | None = Field(None, min_length=8, max_length=64)


class TantervRuleEditorUpdateRequest(BaseModel):
    major_id: int = Field(..., ge=1)
    course_id: int = Field(..., ge=1)
    subgroup: str | None = Field(None, max_length=80)


class TantervEditorPlanCreateRequest(BaseModel):
    major_id: int = Field(..., ge=1)
    max_steps: int = Field(2000, ge=1, le=5000)
    url: str = Field(
        ...,
        min_length=24,
        max_length=2000,
        description="Teljes https://oktweb.neptun.u-szeged.hu/tanterv/…/tanterv.aspx?kod=… link",
    )
    rules_seed: list[dict] = Field(
        ...,
        min_length=1,
        description="Kötelező: követelményszabály kódok (import előtt). Csak ezek a tervben; "
        "kurzus → rule a Neptun szülőlánc mentén. Soronként opcionális min_value: kézi kredit/követelmény "
        "(felülírja a Neptunból parse-olt blokk értéket); ha nincs megadva, a Neptun érték marad.",
    )


class TantervEditorPlanApplyRequest(BaseModel):
    major_id: int = Field(..., ge=1)
    kod: str = Field(..., min_length=3, max_length=80)
    rules: list[dict]
    rows: list[dict]


def _rule_editor_data_thread(major_id: int):
    db = SessionLocal()
    try:
        major = db.query(models.Major).filter(models.Major.id == major_id).first()
        if not major:
            raise ValueError("A megadott major_id nem létezik.")
        rules = (
            db.query(models.MajorRequirementRule)
            .filter(models.MajorRequirementRule.major_id == major_id)
            .order_by(models.MajorRequirementRule.code.asc())
            .all()
        )
        cms = (
            db.query(models.CourseMajor, models.Course)
            .join(models.Course, models.Course.id == models.CourseMajor.course_id)
            .filter(models.CourseMajor.major_id == major_id)
            .order_by(models.Course.course_code.asc())
            .all()
        )
        return {
            "major_id": major_id,
            "rules": [
                {
                    "code": r.code,
                    "label_hu": r.label_hu,
                    "requirement_type": r.requirement_type,
                    "parent_rule_code": getattr(r, "parent_rule_code", None),
                    "min_value": int(r.min_value or 0),
                    "value_type": getattr(r, "value_type", None) or "credits",
                }
                for r in rules
            ],
            "rows": [
                {
                    "course_id": c.id,
                    "course_code": c.course_code,
                    "name": c.name,
                    "type": cm.type,
                    "subgroup": cm.subgroup,
                    "credit": cm.credit,
                    "semester": cm.semester,
                }
                for cm, c in cms
            ],
        }
    finally:
        db.close()


def _rule_editor_set_subgroup_thread(major_id: int, course_id: int, subgroup: str | None):
    db = SessionLocal()
    try:
        cm = (
            db.query(models.CourseMajor)
            .filter(
                models.CourseMajor.major_id == major_id,
                models.CourseMajor.course_id == course_id,
            )
            .first()
        )
        if not cm:
            raise ValueError("Nem található ilyen szak-tárgy kapcsolat.")
        sg = (subgroup or "").strip()
        if sg:
            rule = (
                db.query(models.MajorRequirementRule)
                .filter(
                    models.MajorRequirementRule.major_id == major_id,
                    models.MajorRequirementRule.code == sg,
                )
                .first()
            )
            if not rule:
                raise ValueError("A kiválasztott rule kód nem létezik ennél a szaknál.")
            cm.subgroup = rule.code
            rt = (rule.requirement_type or "").lower().strip()
            if rt in ("required", "elective", "optional"):
                cm.type = rt
        else:
            cm.subgroup = None
        db.commit()
        return {
            "ok": True,
            "major_id": major_id,
            "course_id": course_id,
            "subgroup": cm.subgroup,
            "type": cm.type,
        }
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _editor_plan_create_thread(
    major_id: int,
    kod: str,
    max_steps: int,
    rules_seed: list[dict] | None,
):
    db = SessionLocal()
    try:
        payload = build_import_editor_plan(
            db,
            major_id=major_id,
            kod=kod,
            max_steps=max_steps,
            rules_seed=rules_seed,
        )
        plan_id = create_plan(payload)
        return {"ok": True, "plan_id": plan_id, "major_id": major_id, "kod": kod}
    finally:
        db.close()


def _editor_plan_apply_thread(major_id: int, kod: str, rules: list[dict], rows: list[dict]):
    db = SessionLocal()
    try:
        return apply_import_editor_plan(db, major_id=major_id, kod=kod, rules=rules, rows=rows)
    finally:
        db.close()


@router.post("/tanterv/import")
async def tanterv_import(
    payload: TantervImportRequest,
    _admin: dict = Depends(admin_required),
):
    u = (payload.url or "").strip()
    try:
        return await asyncio.to_thread(
            _import_from_url_thread,
            u,
            payload.major_id,
            payload.max_steps,
            payload.create_rules,
            payload.dry_run,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Neptun import sikertelen: {e}")


@router.post("/tanterv/import-revert")
async def tanterv_import_revert(
    payload: TantervImportRevertRequest,
    _admin: dict = Depends(admin_required),
):
    try:
        result = await asyncio.to_thread(
            _revert_import_thread,
            payload.major_id,
            (payload.snapshot_id or "").strip() or None,
        )
        return {
            "ok": True,
            "message": "Import előtti állapot visszaállítva.",
            **result,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Visszaállítás sikertelen: {e}")


@router.post("/tanterv/editor-plan")
async def tanterv_editor_plan_create(
    payload: TantervEditorPlanCreateRequest,
    _admin: dict = Depends(admin_required),
):
    u = (payload.url or "").strip()
    try:
        k = parse_kod_from_url(u)
        rs = payload.rules_seed if isinstance(payload.rules_seed, list) else []
        if not rs:
            raise ValueError("A szerkesztői tervhez kötelező legalább egy rules_seed sor.")
        return await asyncio.to_thread(
            _editor_plan_create_thread,
            payload.major_id,
            k,
            payload.max_steps,
            rs,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Szerkesztési terv létrehozása sikertelen: {e}")


@router.get("/tanterv/editor-plan/{plan_id}")
async def tanterv_editor_plan_get(plan_id: str, _admin: dict = Depends(admin_required)):
    try:
        return read_plan(plan_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Szerkesztési terv betöltése sikertelen: {e}")


@router.post("/tanterv/editor-plan/{plan_id}/apply")
async def tanterv_editor_plan_apply(
    plan_id: str,
    payload: TantervEditorPlanApplyRequest,
    _admin: dict = Depends(admin_required),
):
    try:
        result = await asyncio.to_thread(
            _editor_plan_apply_thread,
            payload.major_id,
            payload.kod,
            payload.rules,
            payload.rows,
        )
        mark_plan_applied(plan_id)
        return {"ok": True, **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Szerkesztési terv alkalmazása sikertelen: {e}")


@router.get("/tanterv/rule-editor")
async def tanterv_rule_editor_data(
    major_id: int,
    _admin: dict = Depends(admin_required),
):
    try:
        return await asyncio.to_thread(_rule_editor_data_thread, int(major_id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Rule editor adatlekérés sikertelen: {e}")


@router.post("/tanterv/rule-editor/set-subgroup")
async def tanterv_rule_editor_set_subgroup(
    payload: TantervRuleEditorUpdateRequest,
    _admin: dict = Depends(admin_required),
):
    try:
        return await asyncio.to_thread(
            _rule_editor_set_subgroup_thread,
            payload.major_id,
            payload.course_id,
            payload.subgroup,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Rule editor mentés sikertelen: {e}")


@router.post("/tanterv/import-html")
async def tanterv_import_html(
    file: UploadFile = File(...),
    major_id: int = Form(...),
    create_rules: bool = Form(True),
    dry_run: bool = Form(False),
    kod_hint: str | None = Form(None),
    _admin: dict = Depends(admin_required),
):
    """
    Böngészőben mentett teljes tanterv HTML (.html) - egy parse, 0 Neptun HTTP.
    A Neptunban minden „+” sort nyiss ki, majd Mentés másként → feltöltés.
    """
    raw = await file.read(_HTML_UPLOAD_MAX_BYTES + 1)
    if len(raw) > _HTML_UPLOAD_MAX_BYTES:
        raise HTTPException(status_code=400, detail="A fájl túl nagy (max. 12 MB).")
    html = _bytes_to_html_text(raw)
    kh = (kod_hint or "").strip() or None
    try:
        return await asyncio.to_thread(
            _import_html_thread,
            html,
            major_id,
            create_rules,
            dry_run,
            kh,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"HTML import sikertelen: {e}")
