"""
Neptun import előtti állapot JSON snapshotja ``runtime/import_snapshots`` alatt; visszaállítás szabályok + course_major szintre.

A visszagörgetés törli és újraírja az adott szakhoz tartozó ``course_major`` és ``major_requirement_rules`` sorokat;
a snapshot óta importált, máshol nem hivatkozott kurzusok opcionálisan törlődnek.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.db import models


def _snapshot_dir() -> Path:
    root = Path(__file__).resolve().parents[2]
    out = root / "runtime" / "import_snapshots"
    out.mkdir(parents=True, exist_ok=True)
    return out


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _safe_int(v: Any, default: int = 0) -> int:
    try:
        return int(v)
    except Exception:
        return default


def create_major_import_snapshot(db: Session, *, major_id: int, source_kod: str | None) -> str:
    rules = (
        db.query(models.MajorRequirementRule)
        .filter(models.MajorRequirementRule.major_id == major_id)
        .all()
    )
    cms = db.query(models.CourseMajor).filter(models.CourseMajor.major_id == major_id).all()

    snapshot_id = uuid.uuid4().hex
    payload: dict[str, Any] = {
        "version": 1,
        "snapshot_id": snapshot_id,
        "created_at": _now_iso(),
        "reverted_at": None,
        "major_id": major_id,
        "source_kod": (source_kod or "").strip()[:80] or None,
        "major_requirement_rules": [
            {
                "code": r.code,
                "label_hu": r.label_hu,
                "label_en": r.label_en,
                "requirement_type": r.requirement_type,
                "subgroup": r.subgroup,
                "parent_rule_code": getattr(r, "parent_rule_code", None),
                "value_type": r.value_type,
                "min_value": _safe_int(r.min_value, 0),
                "include_in_total": bool(r.include_in_total),
                "is_specialization_root": bool(getattr(r, "is_specialization_root", False)),
            }
            for r in rules
        ],
        "course_major": [
            {
                "course_id": _safe_int(cm.course_id, 0),
                "credit": _safe_int(cm.credit, 0),
                "semester": _safe_int(cm.semester, 1),
                "type": cm.type,
                "subgroup": cm.subgroup,
            }
            for cm in cms
        ],
    }

    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    fn = f"{ts}_major{major_id}_{snapshot_id}.json"
    (_snapshot_dir() / fn).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return snapshot_id


def _read_snapshot_file(snapshot_id: str, major_id: int | None) -> tuple[Path, dict[str, Any]]:
    d = _snapshot_dir()
    candidates = sorted(d.glob(f"*_{snapshot_id}.json"), reverse=True)
    if not candidates:
        raise ValueError("Nem található import snapshot ehhez az azonosítóhoz.")
    p = candidates[0]
    payload = json.loads(p.read_text(encoding="utf-8"))
    snap_mid = _safe_int(payload.get("major_id"), -1)
    if major_id is not None and snap_mid != major_id:
        raise ValueError("A snapshot nem ehhez a major_id-hoz tartozik.")
    return p, payload


def _read_latest_snapshot_for_major(major_id: int) -> tuple[Path, dict[str, Any]]:
    d = _snapshot_dir()
    candidates = sorted(d.glob(f"*_major{major_id}_*.json"), reverse=True)
    if not candidates:
        raise ValueError("Nincs elérhető snapshot ehhez a szakhoz.")
    for p in candidates:
        payload = json.loads(p.read_text(encoding="utf-8"))
        if not payload.get("reverted_at"):
            return p, payload
    raise ValueError("Ehhez a szakhoz minden snapshot már vissza lett állítva.")


def _restore_from_payload(db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    major_id = _safe_int(payload.get("major_id"), 0)
    if major_id <= 0:
        raise ValueError("Érvénytelen snapshot major_id.")

    rules = payload.get("major_requirement_rules") or []
    cms = payload.get("course_major") or []
    snapshot_course_ids = {_safe_int(x.get("course_id"), 0) for x in cms if _safe_int(x.get("course_id"), 0) > 0}
    current_course_ids = {
        _safe_int(x[0], 0)
        for x in db.query(models.CourseMajor.course_id).filter(models.CourseMajor.major_id == major_id).all()
        if _safe_int(x[0], 0) > 0
    }
    imported_extra_ids = sorted(current_course_ids - snapshot_course_ids)

    try:
        db.query(models.CourseMajor).filter(models.CourseMajor.major_id == major_id).delete(synchronize_session=False)
        db.query(models.MajorRequirementRule).filter(models.MajorRequirementRule.major_id == major_id).delete(
            synchronize_session=False
        )
        db.flush()

        for r in rules:
            prc = r.get("parent_rule_code")
            db.add(
                models.MajorRequirementRule(
                    major_id=major_id,
                    code=str(r.get("code") or "")[:80],
                    label_hu=str(r.get("label_hu") or "")[:255],
                    label_en=(str(r.get("label_en"))[:255] if r.get("label_en") is not None else None),
                    requirement_type=str(r.get("requirement_type") or "required")[:50],
                    subgroup=(str(r.get("subgroup"))[:80] if r.get("subgroup") is not None else None),
                    parent_rule_code=(
                        str(prc)[:80] if prc is not None and str(prc).strip() else None
                    ),
                    value_type=str(r.get("value_type") or "credits")[:20],
                    min_value=_safe_int(r.get("min_value"), 0),
                    include_in_total=bool(r.get("include_in_total")),
                    is_specialization_root=bool(r.get("is_specialization_root", False)),
                )
            )

        for cm in cms:
            cid = _safe_int(cm.get("course_id"), 0)
            if cid <= 0:
                continue
            db.add(
                models.CourseMajor(
                    course_id=cid,
                    major_id=major_id,
                    credit=_safe_int(cm.get("credit"), 0),
                    semester=max(1, _safe_int(cm.get("semester"), 1)),
                    type=str(cm.get("type") or "required")[:50],
                    subgroup=(str(cm.get("subgroup"))[:50] if cm.get("subgroup") is not None else None),
                )
            )

        deleted_extra_courses = 0
        for cid in imported_extra_ids:
            has_cm = db.query(models.CourseMajor.id).filter(models.CourseMajor.course_id == cid).first() is not None
            has_progress = db.query(models.Progress.id).filter(models.Progress.course_id == cid).first() is not None
            has_eq = (
                db.query(models.CourseEquivalence.id)
                .filter(
                    (models.CourseEquivalence.course_id == cid) | (models.CourseEquivalence.equivalent_course_id == cid)
                )
                .first()
                is not None
            )
            if has_cm or has_progress or has_eq:
                continue
            db.query(models.Course).filter(models.Course.id == cid).delete(synchronize_session=False)
            deleted_extra_courses += 1

        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "major_id": major_id,
        "restored_rules": len(rules),
        "restored_course_major": len(cms),
        "deleted_extra_courses": deleted_extra_courses,
    }


def revert_import_snapshot(db: Session, *, snapshot_id: str, major_id: int | None = None) -> dict[str, Any]:
    path, payload = _read_snapshot_file(snapshot_id, major_id)
    if payload.get("reverted_at"):
        raise ValueError("Ez a snapshot már vissza lett állítva.")
    result = _restore_from_payload(db, payload)
    payload["reverted_at"] = _now_iso()
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"snapshot_id": payload.get("snapshot_id"), **result, "reverted_at": payload.get("reverted_at")}


def revert_latest_import_snapshot(db: Session, *, major_id: int) -> dict[str, Any]:
    path, payload = _read_latest_snapshot_for_major(major_id)
    if payload.get("reverted_at"):
        raise ValueError("Nincs visszaállítható snapshot.")
    result = _restore_from_payload(db, payload)
    payload["reverted_at"] = _now_iso()
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"snapshot_id": payload.get("snapshot_id"), **result, "reverted_at": payload.get("reverted_at")}
