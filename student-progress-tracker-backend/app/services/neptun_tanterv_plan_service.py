"""
Szerkesztői import tervek perzisztenciája: ``runtime/import_plans`` JSON (azonosító, létrehozás, alkalmazva jelölés).
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _plan_dir() -> Path:
    root = Path(__file__).resolve().parents[2]
    out = root / "runtime" / "import_plans"
    out.mkdir(parents=True, exist_ok=True)
    return out


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def create_plan(payload: dict[str, Any]) -> str:
    plan_id = uuid.uuid4().hex
    doc = {
        "plan_id": plan_id,
        "created_at": _now_iso(),
        "applied_at": None,
        **payload,
    }
    (_plan_dir() / f"{plan_id}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    return plan_id


def read_plan(plan_id: str) -> dict[str, Any]:
    p = _plan_dir() / f"{plan_id}.json"
    if not p.exists():
        raise ValueError("Nem található ilyen import szerkesztési terv.")
    return json.loads(p.read_text(encoding="utf-8"))


def mark_plan_applied(plan_id: str) -> None:
    p = _plan_dir() / f"{plan_id}.json"
    if not p.exists():
        return
    doc = json.loads(p.read_text(encoding="utf-8"))
    doc["applied_at"] = _now_iso()
    p.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
