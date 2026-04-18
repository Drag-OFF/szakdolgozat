"""
Neptun mintatanterv import: HTML (távoli bontás vagy feltöltés) → ``courses``, ``course_major``, ``major_requirement_rules``.

**Előnézet (dry_run):** a Neptun POST-ok száma legfeljebb ``_DRY_RUN_EXPAND_CAP`` (kb. 1–3 perc lineáris idővel).

**Biztonság:** csak a megengedett SZTE Neptun host és ``/tanterv/`` útvonal; URL-ből ``kod`` paraméter kiolvasás.

Import előtt opcionális snapshot a visszagörgetéshez (lásd ``neptun_import_rollback_service``).
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import models
from app.db import schemas
from app.services.neptun_import_rollback_service import create_major_import_snapshot
from app.services.neptun_tanterv_expand_service import get_expanded_tanterv_html
from app.services.neptun_tanterv_parse import parse_tanterv_full

_ALLOWED_IMPORT_HOST = "oktweb.neptun.u-szeged.hu"
_TANTERV_APP_PATH_PREFIX = "/tanterv/"
_DRY_RUN_EXPAND_CAP = 1000
_HTML_IMPORT_MAX_BYTES = 12 * 1024 * 1024
_COURSES_SAMPLE_N = 3
_ERRORS_SAMPLE_N = 5
_COURSE_CODE_SHAPE_RE = re.compile(r"^[A-Z]{2,12}\d{2,6}[A-Z]{0,4}$", re.I)
_COURSE_CODE_DASH_SHAPE_RE = re.compile(r"^[A-Z]{2,12}\d{2,6}[A-Z]{0,4}-[A-Z0-9]{1,20}(?:-[A-Z0-9]+)*$", re.I)


_UNICODE_DASH_CHARS = (
    "\u2010",
    "\u2011",
    "\u2012",
    "\u2013",
    "\u2014",
    "\u2015",
    "\u2212",
    "\uFE58",
    "\uFE63",
    "\uFF0D",
)


def _normalize_code(s: str) -> str:
    t = (s or "").strip()
    for ch in _UNICODE_DASH_CHARS:
        t = t.replace(ch, "-")
    return re.sub(r"\s+", "", t).upper()


_LEGACY_TE_SUFFIX_RE = re.compile(r"^([A-Z]{2,12}\d{2,6}[A-Z]{0,4})-TE$", re.I)


def _canonicalize_course_code_alias(raw_code: str) -> str:
    """
    Régi tantervekben előforduló tárgykód aliasok normalizálása.
    Példa: ``IBK403E-TE`` -> ``IBK403E``.
    """
    code = _normalize_code(raw_code)
    m = _LEGACY_TE_SUFFIX_RE.fullmatch(code)
    if m:
        return m.group(1).upper()
    return code


_RUNTIME_VM_RULES_SEED_JSON = Path(__file__).resolve().parents[2] / "runtime" / "vm_bsc_2019_5_tt_mk_rules_seed.json"


def _load_min_by_code_from_runtime_json(path: Path) -> dict[str, int]:
    if not path.is_file():
        return {}
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}
    if not isinstance(raw, list):
        return {}
    out: dict[str, int] = {}
    for x in raw:
        if not isinstance(x, dict):
            continue
        c = _normalize_code(str(x.get("code") or ""))
        if not c:
            continue
        out[c] = _coerce_rule_min_value(x.get("min_value"))
    return out


def _seed_row_missing_explicit_min_value(item: dict[str, Any]) -> bool:
    """True = nincs kézzel megadott minimum (hiányzó / null / üres string) - lehet kitölteni referenciából."""
    if "min_value" not in item:
        return True
    v = item.get("min_value")
    if v is None:
        return True
    if isinstance(v, str) and not str(v).strip():
        return True
    return False


def overlay_rules_seed_min_from_runtime_reference(seed_rows: list[dict[str, Any]]) -> None:
    """
    rules_seed sorok: ha nincs explicit min_value, a Neptun parse általában 0-t ad vissza a blokksorokra.
    A repóban lévő vm_bsc JSON-ban lévő kódokhoz beírjuk a referencia min_value-t.
    """
    if not seed_rows:
        return
    ref = _load_min_by_code_from_runtime_json(_RUNTIME_VM_RULES_SEED_JSON)
    if not ref:
        return
    for item in seed_rows:
        if not isinstance(item, dict):
            continue
        c = _normalize_code(str(item.get("code") or ""))
        if not c or c not in ref:
            continue
        if not _seed_row_missing_explicit_min_value(item):
            continue
        item["min_value"] = ref[c]


def _coerce_rule_min_value(v: Any) -> int:
    """rules_seed / szerkesztő terv: min_value lehet szám, string vagy hiányzik."""
    if v is None:
        return 0
    if isinstance(v, bool):
        return int(v)
    if isinstance(v, (int, float)):
        if isinstance(v, float) and (v != v):  
            return 0
        return max(0, int(v))
    s = str(v).strip()
    if not s:
        return 0
    try:
        return max(0, int(float(s.replace(",", "."))))
    except (TypeError, ValueError):
        return 0


def _is_course_like_code(code: str) -> bool:
    c = _normalize_code(code)
    if not c:
        return False
    return bool(_COURSE_CODE_SHAPE_RE.fullmatch(c) or _COURSE_CODE_DASH_SHAPE_RE.fullmatch(c))


def parse_kod_from_url(url: str) -> str:
    """
    Csak a SZTE Neptun mintatanterv oldal teljes https linkje fogadható el:
    https://oktweb.neptun.u-szeged.hu/tanterv/…/tanterv.aspx?kod=…
    """
    u = str(url or "").strip()
    if not u:
        raise ValueError("Üres URL.")
    parsed = urlparse(u)
    if (parsed.scheme or "").lower() != "https":
        raise ValueError("Csak https URL engedélyezett (http nem).")
    host = (parsed.netloc or "").split("@")[-1].split(":")[0].lower()
    if host != _ALLOWED_IMPORT_HOST:
        raise ValueError(f"Csak https://{_ALLOWED_IMPORT_HOST}/tanterv/… URL engedélyezett.")
    path_norm = (parsed.path or "").replace("\\", "/")
    path_low = path_norm.lower()
    if not path_low.startswith(_TANTERV_APP_PATH_PREFIX):
        raise ValueError("Az URL elérési útja a /tanterv/ alkalmazás alól kell induljon.")
    if "tanterv.aspx" not in path_low:
        raise ValueError("A linknek a tanterv.aspx oldalra kell mutatnia.")
    qs = parse_qs(parsed.query)
    raw = (qs.get("kod") or qs.get("KOD") or [None])[0]
    if not raw:
        raise ValueError("Az URL-ben nincs „kod” query paraméter (pl. …?kod=BSZKPTI-N1).")
    return unquote(str(raw).strip())


def load_major_rules_index(db: Session, major_id: int) -> dict[str, models.MajorRequirementRule]:
    rows = (
        db.query(models.MajorRequirementRule)
        .filter(models.MajorRequirementRule.major_id == major_id)
        .all()
    )
    return {r.code.upper(): r for r in rows}


def ensure_major_requirement_rules(
    db: Session,
    major_id: int,
    discovered: list[dict[str, Any]],
) -> int:
    """
    Új szabály sorok beszúrása a parse ``discovered`` listából (duplikátum kihagyva).

    Kurzuskód alakú kódok nem kerülnek szabályként az adatbázisba (védelem a téves besorolás ellen).
    """
    created = 0
    for d in discovered:
        code = _normalize_code(str(d.get("code") or ""))
        if not code:
            continue
        if _is_course_like_code(code):
            continue
        exists = (
            db.query(models.MajorRequirementRule)
            .filter(
                models.MajorRequirementRule.major_id == major_id,
                models.MajorRequirementRule.code == code,
            )
            .first()
        )
        if exists:
            continue
        raw_parent = d.get("parent_code") if d.get("parent_code") is not None else d.get("parent_rule_code")
        parent_rule_code: str | None = None
        if raw_parent is not None and str(raw_parent).strip():
            pu = _normalize_code(str(raw_parent))
            if pu and pu != code:
                parent_rule_code = pu[:80]
        req_rt = str(d.get("requirement_type") or "required").lower()
        if req_rt not in ("required", "elective", "optional", "practice", "pe"):
            req_rt = "required"
        vt = str(d.get("value_type") or "credits").lower()
        if vt not in ("credits", "count", "hours"):
            vt = "credits"
        payload = schemas.MajorRequirementRuleCreate(
            major_id=major_id,
            code=code,
            label_hu=(d.get("label_hu") or code)[:255],
            label_en=None,
            requirement_type=req_rt,
            subgroup=code,
            parent_rule_code=parent_rule_code,
            value_type=vt,
            min_value=_coerce_rule_min_value(d.get("min_value")),
            include_in_total=bool(d.get("include_in_total", True)),
            is_specialization_root=bool(d.get("is_specialization_root", False)),
        )
        row_dict = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
        db.add(models.MajorRequirementRule(**row_dict))
        created += 1
    if created:
        db.commit()
    return created


def _apply_aggregate_parent_rule_include_flags(db: Session, major_id: int) -> None:
    db.execute(
        text(
            """
            UPDATE major_requirement_rules
            SET include_in_total = 0
            WHERE major_id = :mid AND UPPER(TRIM(code)) IN ('SZAKM', 'KKV')
            """
        ),
        {"mid": major_id},
    )
    db.commit()


def _get_or_create_course(db: Session, course_code: str, name: str) -> tuple[models.Course, bool]:
    """Meglévő kurzus visszaadása, vagy létrehozás; üres ``name_en`` esetén feltöltés UI fallbackhez."""
    code = _canonicalize_course_code_alias(course_code)
    c = db.query(models.Course).filter(models.Course.course_code == code).first()
    if c:
        if not (c.name_en or "").strip():
            c.name_en = (c.name or name or code)[:255]
            db.flush()
        return c, False
    
    raw_code = _normalize_code(course_code)
    if raw_code != code:
        c_raw = db.query(models.Course).filter(models.Course.course_code == raw_code).first()
        if c_raw:
            if not (c_raw.name_en or "").strip():
                c_raw.name_en = (c_raw.name or name or raw_code)[:255]
                db.flush()
            return c_raw, False
    display = (name or code).strip() or code
    c = models.Course(course_code=code, name=display[:255], name_en=display[:255])
    db.add(c)
    db.flush()
    return c, True


def _get_existing_course_by_alias(db: Session, course_code: str):
    """Csak létező kurzust keres alias-feloldással, új kurzust nem hoz létre."""
    code = _canonicalize_course_code_alias(course_code)
    c = db.query(models.Course).filter(models.Course.course_code == code).first()
    if c:
        return c
    raw_code = _normalize_code(course_code)
    if raw_code != code:
        return db.query(models.Course).filter(models.Course.course_code == raw_code).first()
    return None


def _looks_like_thesis_row(course_code: str, course_name: str) -> bool:
    _ = course_code  
    name_u = str(course_name or "").upper()
    return "SZAKDOLGOZAT" in name_u or "THESIS" in name_u


def _looks_like_practice_row(course_code: str, course_name: str) -> bool:
    _ = course_code  
    name_u = str(course_name or "").upper()
    return "SZAKMAI GYAKORLAT" in name_u or "INTERNSHIP" in name_u


def _upsert_course_major(
    db: Session,
    course_id: int,
    major_id: int,
    credit: int,
    semester: int,
    cm_type: str,
    subgroup: str | None,
) -> tuple[str, int]:
    existing = (
        db.query(models.CourseMajor)
        .filter(
            models.CourseMajor.course_id == course_id,
            models.CourseMajor.major_id == major_id,
        )
        .first()
    )
    if existing:
        existing.credit = int(credit or 0)
        existing.semester = int(semester or 1)
        existing.type = cm_type
        existing.subgroup = subgroup
        db.flush()
        return "updated", existing.id
    db_cm = models.CourseMajor(
        course_id=course_id,
        major_id=major_id,
        credit=int(credit or 0),
        semester=int(semester or 1),
        type=cm_type,
        subgroup=subgroup,
    )
    db.add(db_cm)
    db.flush()
    return "created", db_cm.id


def _backfill_key_blocks_course_major(
    db: Session,
    *,
    major_id: int,
    valid_rule_codes: set[str],
) -> tuple[int, int]:
    """
    Védőháló: ha a plan rows-ból kimaradnak szakdolgozat/gyakorlat sorok,
    de a szabályok között van MK-SZD / MK-SZG, akkor minimális course_major kapcsolatot pótolunk.
    """
    created = 0
    updated = 0

    if "MK-SZD" in valid_rule_codes:
        thesis_rows = db.execute(
            text(
                """
                SELECT cm.course_id, cm.credit, cm.semester
                FROM course_major cm
                JOIN courses c ON c.id = cm.course_id
                WHERE cm.major_id <> :mid
                  AND (
                    cm.subgroup = 'MK-SZD'
                    OR LOWER(c.name) LIKE '%szakdolgozat%'
                    OR LOWER(c.name) LIKE '%thesis%'
                  )
                ORDER BY cm.course_id, cm.major_id DESC
                """
            ),
            {"mid": major_id},
        ).fetchall()
        seen: set[int] = set()
        for cid, credit, semester in thesis_rows:
            if int(cid) in seen:
                continue
            seen.add(int(cid))
            action, _ = _upsert_course_major(
                db,
                int(cid),
                major_id,
                int(credit or 0),
                int(semester or 1),
                "required",
                "MK-SZD",
            )
            if action == "created":
                created += 1
            else:
                updated += 1

    if "MK-SZG" in valid_rule_codes:
        practice_rows = db.execute(
            text(
                """
                SELECT cm.course_id, cm.credit, cm.semester
                FROM course_major cm
                JOIN courses c ON c.id = cm.course_id
                WHERE cm.major_id <> :mid
                  AND (
                    cm.subgroup IN ('MK-SZG', 'practice_hours')
                    OR LOWER(c.name) LIKE '%szakmai gyakorlat%'
                    OR LOWER(c.name) LIKE '%internship%'
                  )
                ORDER BY cm.course_id, cm.major_id DESC
                """
            ),
            {"mid": major_id},
        ).fetchall()
        seen: set[int] = set()
        for cid, credit, semester in practice_rows:
            if int(cid) in seen:
                continue
            seen.add(int(cid))
            action, _ = _upsert_course_major(
                db,
                int(cid),
                major_id,
                int(credit or 0),
                int(semester or 1),
                "practice",
                "MK-SZG",
            )
            if action == "created":
                created += 1
            else:
                updated += 1

    return created, updated


def _prepare_rules_candidates(discovered: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    rules_full: list[dict[str, Any]] = list(discovered)
    rules_candidates: list[dict[str, Any]] = []
    rules_course_like_skipped = 0
    for d in rules_full:
        c = str(d.get("code") or "")
        if _is_course_like_code(c):
            rules_course_like_skipped += 1
            continue
        rules_candidates.append(d)
    return rules_candidates, rules_course_like_skipped


def _discovered_index_by_code(discovered: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for d in discovered:
        c = _normalize_code(str(d.get("code") or ""))
        if c and c not in out:
            out[c] = d
    return out


def _nearest_mk_rule_code(
    start_code: str | None,
    by_code: dict[str, dict[str, Any]],
    *,
    max_hops: int = 500,
) -> str | None:
    """A szülőlánc mentén az első MK-* kód (TT/TE/KTUDSZ alól is)."""
    if not start_code:
        return None
    cur = _normalize_code(str(start_code))
    seen: set[str] = set()
    hops = 0
    while cur and hops < max_hops:
        if cur in seen:
            break
        seen.add(cur)
        if cur.startswith("MK-"):
            return cur
        node = by_code.get(cur)
        if not node:
            break
        pc = node.get("parent_code")
        if not pc:
            break
        cur = _normalize_code(str(pc))
        hops += 1
    return None


def _coerce_parent_chain_to_allowed_codes(
    start_code: str | None,
    allowed: set[str],
    by_code: dict[str, dict[str, Any]],
    *,
    max_hops: int = 500,
) -> str | None:
    """
    Neptun szülőlánc (kurzus → TT/TE → MK → …) mentén az első kód, ami szerepel az `allowed` halmazban.
    User rule seed: a felhasználó által megadott kódlista; beágyazott MK (pl. MK-DIF-MATSZT) és fő MK (MK-DSZ) is lehet.
    """
    cur = _normalize_code(str(start_code or "")) or None
    if not cur or not allowed:
        return None
    seen: set[str] = set()
    hops = 0
    while cur and hops < max_hops:
        if cur in seen:
            break
        seen.add(cur)
        if cur in allowed:
            return cur
        node = by_code.get(cur)
        if not node:
            break
        pc = node.get("parent_code")
        if not pc:
            break
        cur = _normalize_code(str(pc))
        hops += 1
    return None


def _is_ancestor_of_code(a: str, b: str, by_code: dict[str, dict[str, Any]], *, max_hops: int = 500) -> bool:
    """True, ha ``a`` a ``b`` szülőláncán szerepel (``b`` felmenője)."""
    au = _normalize_code(a)
    bu = _normalize_code(b)
    if not au or not bu:
        return False
    cur = bu
    seen: set[str] = set()
    hops = 0
    while cur and hops < max_hops:
        if cur == au:
            return True
        if cur in seen:
            break
        seen.add(cur)
        node = by_code.get(cur)
        pc = node.get("parent_code") if node else None
        cur = _normalize_code(str(pc or "")) if pc else None
        hops += 1
    return False


def _collect_allowed_hits_walking_up(
    start: str | None,
    allowed: set[str],
    by_code: dict[str, dict[str, Any]],
    *,
    max_hops: int = 500,
) -> list[str]:
    """A start kódtól a gyökér felé: minden olyan kód, ami benne van az ``allowed``-ban (sorrend: levélhez közel → távol)."""
    hits: list[str] = []
    cur = _normalize_code(str(start or "")) or None
    seen: set[str] = set()
    hops = 0
    while cur and hops < max_hops:
        if cur in seen:
            break
        seen.add(cur)
        if cur in allowed:
            hits.append(cur)
        node = by_code.get(cur)
        pc = node.get("parent_code") if node else None
        cur = _normalize_code(str(pc or "")) if pc else None
        hops += 1
    return hits


def _pick_preferred_allowed_rule_code(
    hits: list[str],
    by_code: dict[str, dict[str, Any]],
) -> str | None:
    """
    Több engedélyezett találat közül a legspecifikusabb MK-blokk (spec: MK-S-* preferált a MK-DSZ-A előtt).
    """
    if not hits:
        return None
    filtered: list[str] = []
    for h in hits:
        if any(h != x and _is_ancestor_of_code(h, x, by_code) for x in hits):
            continue
        filtered.append(h)
    pool = filtered if filtered else list(hits)
    spec = [h for h in pool if h.startswith("MK-S-")]
    use = spec if spec else pool
    return max(use, key=len)


def _resolve_subgroup_to_allowed_rule(
    row: dict[str, Any],
    allowed: set[str],
    by_code: dict[str, dict[str, Any]],
) -> tuple[str | None, str | None]:
    """
    Kurzus sor → course_major.subgroup: a szülőlánc mentén az összes ``allowed`` találatból
    a legmélyebb / MK-S spec preferált (Neptunban közös MK-DSZ-A ág alól is lehessen MK-S-IA-A).
    """
    for start in (row.get("parent_rule_code"), row.get("matched_rule_code"), row.get("subgroup")):
        chain_hits = _collect_allowed_hits_walking_up(start, allowed, by_code)
        deep = _pick_preferred_allowed_rule_code(chain_hits, by_code)
        if deep:
            return deep, _nearest_mk_rule_code(start, by_code)
    mk_leaf = _nearest_mk_rule_code(row.get("parent_rule_code"), by_code)
    if not mk_leaf:
        mk_leaf = _nearest_mk_rule_code(row.get("matched_rule_code"), by_code)
    if not mk_leaf:
        mk_leaf = _nearest_mk_rule_code(row.get("subgroup"), by_code)
    chain_hits = _collect_allowed_hits_walking_up(mk_leaf, allowed, by_code)
    final = _pick_preferred_allowed_rule_code(chain_hits, by_code)
    if not final:
        final = _coerce_parent_chain_to_allowed_codes(mk_leaf, allowed, by_code)
    return final, mk_leaf


_RULES_SEED_MAX_ITEMS = 150


def _flatten_rules_seed_nested(raw: list[Any] | None, *, max_items: int = _RULES_SEED_MAX_ITEMS) -> list[dict[str, Any]]:
    """
    rules_seed: lapos objektumok és/vagy fa (children).
    A gyerekek kapnak parent_code = szülő code (ha a gyereknek már van parent_code, az marad).
    """
    if not raw:
        return []
    out: list[dict[str, Any]] = []

    def walk(nodes: list[Any], inherited_parent: str | None) -> None:
        if len(out) >= max_items:
            return
        for node in nodes:
            if len(out) >= max_items:
                return
            if not isinstance(node, dict):
                continue
            code = _normalize_code(str(node.get("code") or ""))
            children = node.get("children")
            ch_list = children if isinstance(children, list) else []
            if code:
                flat = {k: v for k, v in node.items() if k != "children"}
                explicit_pc = flat.get("parent_code")
                if explicit_pc is not None and str(explicit_pc).strip():
                    flat["parent_code"] = _normalize_code(str(explicit_pc)) or None
                elif inherited_parent:
                    flat["parent_code"] = inherited_parent
                out.append(flat)
                parent_for_children = code
            else:
                parent_for_children = inherited_parent
            if ch_list:
                walk(ch_list, parent_for_children)

    walk(raw, None)
    return out


def _sanitize_rules_seed(raw: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    if not raw:
        return []
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in raw[:_RULES_SEED_MAX_ITEMS]:
        if not isinstance(item, dict):
            continue
        code = _normalize_code(str(item.get("code") or ""))
        if not code or len(code) > 80 or _is_course_like_code(code):
            continue
        if code in seen:
            continue
        seen.add(code)
        out.append(item)
    return out


def _plan_rules_from_user_seed(
    seed: list[dict[str, Any]],
    by_code: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    plan_rules: list[dict[str, Any]] = []
    for item in seed:
        code = _normalize_code(str(item.get("code") or ""))
        if not code:
            continue
        disc = by_code.get(code)
        raw_lbl = str(item.get("label_hu") or "").strip()
        label = raw_lbl or (str((disc or {}).get("label_hu") or "").strip() if disc else "") or code
        if item.get("depth") is not None:
            try:
                depth = int(item.get("depth") or 0)
            except (TypeError, ValueError):
                depth = int((disc or {}).get("depth") or 0)
        else:
            depth = int((disc or {}).get("depth") or 0)
        parent_raw = item.get("parent_code")
        if parent_raw is not None and str(parent_raw).strip():
            parent_code = _normalize_code(str(parent_raw)) or None
        else:
            p = (disc or {}).get("parent_code") if disc else None
            parent_code = _normalize_code(str(p)) if p else None
        rt = str(item.get("requirement_type") or (disc or {}).get("requirement_type") or "required").lower()
        if rt not in ("required", "elective", "optional", "practice", "pe"):
            rt = "required"
        vt = str(item.get("value_type") or (disc or {}).get("value_type") or "credits").lower()
        if vt not in ("credits", "count", "hours"):
            vt = "credits"
        
        if _seed_row_missing_explicit_min_value(item):
            min_value = _coerce_rule_min_value((disc or {}).get("min_value"))
        else:
            min_value = _coerce_rule_min_value(item.get("min_value"))
        iit = item.get("include_in_total")
        if iit is None:
            iit = (disc or {}).get("include_in_total", True)
        isr = item.get("is_specialization_root")
        if isr is None:
            isr = (disc or {}).get("is_specialization_root", False)
        plan_rules.append(
            {
                "id": code,
                "code": code,
                "label_hu": label[:255],
                "requirement_type": rt,
                "value_type": vt,
                "min_value": min_value,
                "include_in_total": bool(iit),
                "depth": depth,
                "parent_code": parent_code,
                "enabled": True,
                "is_primary_group": depth == 0,
                "is_specialization_root": bool(isr),
            }
        )
    return plan_rules


_AGGREGATE_RULE_CODES_SKIP = frozenset({"SZAKM", "KKV"})
_EXTRA_LETTER_ROOT_CODES = frozenset({"SZV", "SZAKMGY", "SZAKD"})


def _filter_neptun_auto_plan_rules(rules_candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Automatikus terv + közvetlen import: MK-* gyökerek + szakmai gyakorlat/TN + tipikus nem-MK gyökér (SZV, SZAKMGY…).
    KKV/SZAKM aggregátum kihagyva (kurzusok a részblokkokhoz tartoznak).
    Gyakorlat/TN bármely mélységen (pl. SZAKMGY gyakran SZAKM alatt).
    """
    out: list[dict[str, Any]] = []
    for r in rules_candidates:
        code = _normalize_code(str(r.get("code") or ""))
        if not code or code in _AGGREGATE_RULE_CODES_SKIP:
            continue
        rt = str(r.get("requirement_type") or "required").lower()
        if rt in ("practice", "pe"):
            out.append(r)
            continue
        d = int(r.get("depth") or 0)
        if d != 0:
            continue
        if code.startswith("MK-"):
            out.append(r)
            continue
        if code in _EXTRA_LETTER_ROOT_CODES:
            out.append(r)
    return out


def _normalize_rule_parents_for_editor_plan(plan_rules: list[dict[str, Any]]) -> None:
    """Ha a szülő (pl. SZAKM) nincs a tervben, a fa gyökere legyen üres szülő."""
    codes = {_normalize_code(str(r.get("code") or "")) for r in plan_rules}
    for r in plan_rules:
        pc = r.get("parent_code")
        if not pc:
            continue
        pcu = _normalize_code(str(pc))
        if pcu not in codes:
            r["parent_code"] = None


def _recompute_depths_from_parents(plan_rules: list[dict[str, Any]]) -> None:
    """Fa mélység a tervben lévő parent_code lánc alapján (kredit-rollup / szerkesztő primary jelölés)."""
    by_code: dict[str, dict[str, Any]] = {}
    for r in plan_rules:
        c = _normalize_code(str(r.get("code") or ""))
        if c:
            by_code[c] = r
    for r in plan_rules:
        pc = r.get("parent_code")
        if not pc:
            continue
        pcu = _normalize_code(str(pc))
        if not pcu or pcu not in by_code:
            r["parent_code"] = None

    assigned: dict[str, int] = {}
    for r in plan_rules:
        c = _normalize_code(str(r.get("code") or ""))
        if not c:
            continue
        pc = r.get("parent_code")
        if not pc:
            assigned[c] = 0
            continue
        pcu = _normalize_code(str(pc))
        if pcu not in by_code:
            assigned[c] = 0

    changed = True
    safety = 0
    while changed and safety < len(plan_rules) + 5:
        safety += 1
        changed = False
        for r in plan_rules:
            c = _normalize_code(str(r.get("code") or ""))
            if not c or c in assigned:
                continue
            pcu = _normalize_code(str(r.get("parent_code") or ""))
            if pcu in assigned:
                assigned[c] = assigned[pcu] + 1
                changed = True

    for r in plan_rules:
        c = _normalize_code(str(r.get("code") or ""))
        if not c:
            continue
        d = int(assigned.get(c, 0))
        r["depth"] = d
        r["is_primary_group"] = d == 0


def _run_import_pipeline(
    db: Session,
    *,
    major_id: int,
    expand_meta: dict[str, Any],
    rows: list[dict[str, Any]],
    parse_meta: dict[str, Any],
    discovered: list[dict[str, Any]],
    create_rules: bool,
    dry_run: bool,
    expand_max_requested: int,
    expand_max_used: int,
    from_neptun_http: bool,
) -> dict[str, Any]:
    """Parse után: szabályok + course_major upsert + válasz objektum."""
    rules_candidates, rules_course_like_skipped = _prepare_rules_candidates(discovered)
    rules_for_db = _filter_neptun_auto_plan_rules(rules_candidates)
    by_code = _discovered_index_by_code(discovered)
    allowed_mk_roots = {_normalize_code(str(r.get("code") or "")) for r in rules_for_db if r.get("code")}
    rules_created = 0
    warnings: list[str] = []
    snapshot_id: str | None = None

    if not dry_run:
        try:
            snapshot_id = create_major_import_snapshot(
                db,
                major_id=major_id,
                source_kod=str(expand_meta.get("kod") or ""),
            )
        except Exception as ex:  # noqa: BLE001
            raise RuntimeError(f"Import előtti snapshot mentése sikertelen: {ex}") from ex

    if create_rules and rules_for_db and not dry_run:
        rules_created = ensure_major_requirement_rules(db, major_id, rules_for_db)

    if not dry_run:
        _apply_aggregate_parent_rule_include_flags(db, major_id)

    created_courses = 0
    created_course_codes: list[str] = []
    created_cm = 0
    updated_cm = 0
    errors: list[str] = []

    if not dry_run:
        try:
            for r in rows:
                try:
                    code = r["course_code"].strip().upper()
                    name = str(r["name"])
                    c, cnew = _get_or_create_course(db, code, name)
                    if cnew:
                        created_courses += 1
                        created_course_codes.append(code)
                    mk_final, _mk_trace = _resolve_subgroup_to_allowed_rule(r, allowed_mk_roots, by_code)
                    action, _ = _upsert_course_major(
                        db,
                        c.id,
                        major_id,
                        r["credit"],
                        r["semester"],
                        r["type"],
                        mk_final,
                    )
                    if action == "created":
                        created_cm += 1
                    else:
                        updated_cm += 1
                except Exception as ex:  # noqa: BLE001
                    errors.append(f"{r.get('course_code')}: {ex}")
            db.commit()
        except Exception:
            db.rollback()
            raise

    if from_neptun_http and dry_run and expand_max_requested > expand_max_used:
        warnings.append(
            f"Előnézet: a Neptun-lenyitások száma legfeljebb {_DRY_RUN_EXPAND_CAP} (küldött max_steps: {expand_max_requested}). "
            "Teljes kibontáshoz használd az „Import (mentés)” gombot ugyanazzal vagy magasabb max. lépéssel."
        )

    steps = int(expand_meta.get("steps") or 0)
    init_plus = int(expand_meta.get("initial_plus_forms") or 0)
    bulk_used = bool(expand_meta.get("bulk_open_all_used"))
    stopped_early = bool(expand_meta.get("stopped_by_max_steps"))
    queue_left = int(expand_meta.get("queue_remaining") or 0)

    if from_neptun_http and stopped_early and queue_left > 0:
        warnings.append(
            f"A lenyitási lépések száma elérte a max_steps limitet ({expand_meta.get('steps')} lépés), "
            f"még {queue_left} „+” sor volt a sorban - a tanterv csak részben lett kibontva. "
            "Állíts magasabb „Max. lépés” értéket (pl. 1500–3000), és futtasd újra (előnézet vagy import)."
        )
    if from_neptun_http and steps == 0 and init_plus == 0 and not bulk_used:
        warnings.append(
            "A Neptun HTML-ben nem volt „+” lenyitó form (és „Összes nyit” sem futott) - tárgyak nélkül. "
            "Ellenőrizd a kódot és a hálózatot."
        )
    elif from_neptun_http and steps == 0 and init_plus > 0:
        warnings.append("0 lenyitási lépés történt, pedig volt + gomb - próbáld újra; nézd expand.errors.")
    elif len(rows) == 0:
        if from_neptun_http:
            warnings.append(
                "Nem lett egyetlen tárgysor sem. Növeld a max. lépést (pl. 200–500), vagy ellenőrizd a parse-ot."
            )
        else:
            warnings.append(
                "A feltöltött HTML-ben nem találtunk tárgysort. A Neptunban minden blokkot nyisd ki („+”), majd mentsd az oldalt (Ctrl+S) és töltsd fel újra."
            )

    err_sample = errors[:_ERRORS_SAMPLE_N]
    import_summary: dict[str, Any] = {
        "rows_total": len(rows),
        "courses_created": created_courses,
        "created_course_codes": created_course_codes,
        "course_major_created": created_cm,
        "course_major_updated": updated_cm,
        "errors": err_sample,
    }
    if len(errors) > _ERRORS_SAMPLE_N:
        import_summary["errors_total"] = len(errors)
        import_summary["errors_truncated"] = True

    expand_summary: dict[str, Any] = {
        "steps": expand_meta.get("steps"),
        "queue_remaining": expand_meta.get("queue_remaining"),
        "stopped_by_max_steps": expand_meta.get("stopped_by_max_steps"),
        "initial_plus_forms": expand_meta.get("initial_plus_forms"),
        "expand_elapsed_seconds": expand_meta.get("expand_elapsed_seconds"),
        "avg_seconds_per_step": expand_meta.get("avg_seconds_per_step"),
        "final_html_length": expand_meta.get("final_html_length"),
        "inter_post_delay_ms": expand_meta.get("inter_post_delay_ms"),
    }
    if expand_meta.get("bulk_open_all_used"):
        expand_summary["bulk_open_all_used"] = True
        expand_summary["bulk_open_all_seconds"] = expand_meta.get("bulk_open_all_seconds")
    if expand_meta.get("source"):
        expand_summary["source"] = expand_meta.get("source")
    if expand_meta.get("dry_run_neptun_post_cap") is not None:
        expand_summary["dry_run_neptun_post_cap"] = expand_meta.get("dry_run_neptun_post_cap")
    ex_err = expand_meta.get("errors")
    if isinstance(ex_err, list) and ex_err:
        expand_summary["expand_errors_sample"] = ex_err[:3]
    if dry_run and from_neptun_http and expand_max_requested > expand_max_used:
        expand_summary["max_steps_requested"] = expand_max_requested
        expand_summary["max_steps_effective"] = expand_max_used

    parse_summary: dict[str, Any] = {
        "parsed_count": parse_meta.get("parsed_count"),
        "skipped_rows": parse_meta.get("skipped_rows"),
        "header_found": parse_meta.get("header_found"),
        "rules_discovered_new": parse_meta.get("rules_discovered_new"),
    }

    out: dict[str, Any] = {
        "kod": expand_meta.get("kod", "html-upload"),
        "major_id": major_id,
        "dry_run": dry_run,
        "warnings": warnings,
        "expand": expand_summary,
        "parse": parse_summary,
        "rules": {
            "create_rules": create_rules,
            "rules_candidates_total": len(rules_candidates),
            "mk_rules_in_db": len(rules_for_db),
            "course_like_discarded": rules_course_like_skipped,
            "rules_created_in_db": rules_created,
        },
        "import": import_summary,
        "note": "Tömör válasz: nincs teljes tárgy/szabály lista. Mentés után az adatbázisban a teljes import.",
    }
    if snapshot_id:
        out["import_snapshot_id"] = snapshot_id
    if dry_run and rows:
        sample_keys = ("course_code", "name", "credit", "semester", "type")
        out["courses_sample"] = [{k: r.get(k) for k in sample_keys} for r in rows[:_COURSES_SAMPLE_N]]
        out["courses_total"] = len(rows)
    return out


def import_html_string_to_db(
    db: Session,
    *,
    html: str,
    major_id: int,
    create_rules: bool = True,
    dry_run: bool = False,
    kod_hint: str | None = None,
) -> dict[str, Any]:
    """
    Már letöltött / böngészőben mentett teljes tanterv HTML - **egyetlen** parse, 0 Neptun HTTP.
    A felhasználó a Neptunban kézzel kibontja az összes „+” sort, majd „Mentés másként” → .html.
    """
    raw = html or ""
    if len(raw) < 80:
        raise ValueError("A HTML túl rövid - valószínűleg nem teljes tanterv oldal.")
    if len(raw.encode("utf-8")) > _HTML_IMPORT_MAX_BYTES:
        raise ValueError(f"A HTML túl nagy (max. {_HTML_IMPORT_MAX_BYTES // (1024*1024)} MB).")

    major = db.query(models.Major).filter(models.Major.id == major_id).first()
    if not major:
        raise ValueError("A megadott major_id nem létezik.")

    rule_dict: dict[str, Any] = {k: v for k, v in load_major_rules_index(db, major_id).items()}
    rows, parse_meta, discovered = parse_tanterv_full(raw, rule_dict)

    expand_meta: dict[str, Any] = {
        "kod": (kod_hint or "html-upload").strip()[:40],
        "source": "html_file",
        "neptun_http_requests": 0,
        "steps": 0,
        "initial_plus_forms": 0,
        "stopped_by_max_steps": False,
        "queue_remaining": 0,
        "final_html_length": len(raw),
        "errors": [],
    }

    return _run_import_pipeline(
        db,
        major_id=major_id,
        expand_meta=expand_meta,
        rows=rows,
        parse_meta=parse_meta,
        discovered=discovered,
        create_rules=create_rules,
        dry_run=dry_run,
        expand_max_requested=0,
        expand_max_used=0,
        from_neptun_http=False,
    )


def import_tanterv_to_db(
    db: Session,
    *,
    kod: str,
    major_id: int,
    max_steps: int = 5000,
    create_rules: bool = True,
    dry_run: bool = False,
) -> dict[str, Any]:
    major = db.query(models.Major).filter(models.Major.id == major_id).first()
    if not major:
        raise ValueError("A megadott major_id nem létezik.")

    rule_by_code = load_major_rules_index(db, major_id)
    rule_dict: dict[str, Any] = {k: v for k, v in rule_by_code.items()}

    expand_max_requested = max_steps
    expand_max_used = min(max_steps, _DRY_RUN_EXPAND_CAP) if dry_run else max_steps
    if dry_run and max_steps > expand_max_used:
        expand_meta_extra = {
            "dry_run_expand_capped": True,
            "expand_max_requested": expand_max_requested,
            "expand_max_used": expand_max_used,
        }
    else:
        expand_meta_extra = {}

    html, expand_meta = get_expanded_tanterv_html(kod, max_steps=expand_max_used)
    expand_meta.update(expand_meta_extra)
    if dry_run:
        expand_meta["dry_run_neptun_post_cap"] = _DRY_RUN_EXPAND_CAP
    rows, parse_meta, discovered = parse_tanterv_full(html, rule_dict)

    return _run_import_pipeline(
        db,
        major_id=major_id,
        expand_meta=expand_meta,
        rows=rows,
        parse_meta=parse_meta,
        discovered=discovered,
        create_rules=create_rules,
        dry_run=dry_run,
        expand_max_requested=expand_max_requested,
        expand_max_used=expand_max_used,
        from_neptun_http=True,
    )


def import_from_url(
    db: Session,
    *,
    url: str,
    major_id: int,
    max_steps: int = 5000,
    create_rules: bool = True,
    dry_run: bool = False,
) -> dict[str, Any]:
    kod = parse_kod_from_url(url)
    return import_tanterv_to_db(
        db,
        kod=kod,
        major_id=major_id,
        max_steps=max_steps,
        create_rules=create_rules,
        dry_run=dry_run,
    )


def build_import_editor_plan(
    db: Session,
    *,
    major_id: int,
    kod: str,
    max_steps: int,
    rules_seed: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    major = db.query(models.Major).filter(models.Major.id == major_id).first()
    if not major:
        raise ValueError("A megadott major_id nem létezik.")
    html, expand_meta = get_expanded_tanterv_html(kod, max_steps=max_steps)
    rule_dict: dict[str, Any] = {k: v for k, v in load_major_rules_index(db, major_id).items()}
    rows, parse_meta, discovered = parse_tanterv_full(html, rule_dict)
    by_code = _discovered_index_by_code(discovered)
    rules_candidates, rules_course_like_skipped = _prepare_rules_candidates(discovered)
    raw_seed_list = rules_seed if isinstance(rules_seed, list) else None
    seed_flat = _flatten_rules_seed_nested(raw_seed_list) if raw_seed_list else []
    seed_clean = _sanitize_rules_seed(seed_flat if raw_seed_list else None)
    if raw_seed_list and len(raw_seed_list) > 0 and not seed_clean:
        raise ValueError(
            "A megadott rules_seed egyetlen érvényes sort sem tartalmaz "
            "(minden sorhoz kell „code” mező; tárgykód alakú kódok nem lehetnek rule-ok)."
        )
    if seed_clean:
        overlay_rules_seed_min_from_runtime_reference(seed_clean)
    rules_source = "user_seed" if seed_clean else "neptun_auto"

    existing_codes = {
        str(x[0]).strip().upper()
        for x in db.query(models.Course.course_code).all()
        if x and x[0]
    }
    plan_rules: list[dict[str, Any]] = []
    if seed_clean:
        plan_rules = _plan_rules_from_user_seed(seed_clean, by_code)
    else:
        mk_for_editor = _filter_neptun_auto_plan_rules(rules_candidates)
        for r in mk_for_editor:
            d = int(r.get("depth") or 0)
            vt = str(r.get("value_type") or "credits").lower()
            if vt not in ("credits", "count", "hours"):
                vt = "credits"
            plan_rules.append(
                {
                    "id": (r.get("code") or "").strip().upper(),
                    "code": (r.get("code") or "").strip().upper(),
                    "label_hu": (r.get("label_hu") or r.get("code") or "").strip()[:255],
                    "requirement_type": (r.get("requirement_type") or "required"),
                    "value_type": vt,
                    "min_value": _coerce_rule_min_value(r.get("min_value")),
                    "include_in_total": bool(r.get("include_in_total", True)),
                    "depth": d,
                    "parent_code": (r.get("parent_code") or None),
                    "enabled": True,
                    "is_primary_group": d == 0,
                    "is_specialization_root": bool(r.get("is_specialization_root", False)),
                }
            )
    _normalize_rule_parents_for_editor_plan(plan_rules)
    _recompute_depths_from_parents(plan_rules)

    allowed_plan_mk = {_normalize_code(str(r.get("code") or "")) for r in plan_rules if r.get("code")}

    plan_rows: list[dict[str, Any]] = []
    for row in rows:
        code = str(row.get("course_code") or "").strip().upper()
        heur = row.get("heuristic_neptun_concrete_course")
        import_default = True if heur is None else bool(heur)
        mk_show, mk_leaf = _resolve_subgroup_to_allowed_rule(row, allowed_plan_mk, by_code)
        plan_rows.append(
            {
                "course_code": code,
                "name": str(row.get("name") or code),
                "semester": int(row.get("semester") or 1),
                "credit": int(row.get("credit") or 0),
                "type": str(row.get("type") or "required"),
                "subgroup": mk_show,
                "subgroup_major": mk_show,
                "mk_neptun_leaf": mk_leaf,
                "is_new_course": code not in existing_codes,
                "import_as_course": import_default,
                "code_shape_course": _is_course_like_code(code),
                "block_depth": row.get("block_depth"),
                "parent_rule_code": row.get("parent_rule_code"),
                "parent_rule_is_neptun_group": bool(row.get("parent_rule_is_neptun_group")),
                "weekly_hours": row.get("weekly_hours"),
                "semester_hours": row.get("semester_hours"),
                "heuristic_neptun_concrete_course": heur,
            }
        )

    return {
        "major_id": major_id,
        "kod": kod,
        "expand": {
            "steps": expand_meta.get("steps"),
            "queue_remaining": expand_meta.get("queue_remaining"),
            "stopped_by_max_steps": expand_meta.get("stopped_by_max_steps"),
            "initial_plus_forms": expand_meta.get("initial_plus_forms"),
            "expand_elapsed_seconds": expand_meta.get("expand_elapsed_seconds"),
            "avg_seconds_per_step": expand_meta.get("avg_seconds_per_step"),
            "final_html_length": expand_meta.get("final_html_length"),
            "bulk_open_all_used": expand_meta.get("bulk_open_all_used"),
            "bulk_open_all_seconds": expand_meta.get("bulk_open_all_seconds"),
        },
        "parse": {
            "parsed_count": parse_meta.get("parsed_count"),
            "skipped_rows": parse_meta.get("skipped_rows"),
            "header_found": parse_meta.get("header_found"),
            "rules_discovered_new": parse_meta.get("rules_discovered_new"),
            "rules_candidates_total": len(rules_candidates),
            "rules_in_editor_plan": len(plan_rules),
            "rules_source": rules_source,
            "rules_seed_items_used": len(seed_clean),
            "has_heti_hours_column": parse_meta.get("has_heti_hours_column"),
        },
        "rules_course_like_discarded": rules_course_like_skipped,
        "rules": plan_rules,
        "rows": plan_rows,
    }


def apply_import_editor_plan(
    db: Session,
    *,
    major_id: int,
    kod: str,
    rules: list[dict[str, Any]],
    rows: list[dict[str, Any]],
) -> dict[str, Any]:
    major = db.query(models.Major).filter(models.Major.id == major_id).first()
    if not major:
        raise ValueError("A megadott major_id nem létezik.")

    enabled_rule_codes: set[str] = set()
    for r in rules:
        if not bool(r.get("enabled", True)):
            continue
        c = _normalize_code(str(r.get("code") or ""))
        if c and not _is_course_like_code(c):
            enabled_rule_codes.add(c)

    enabled_rules: list[dict[str, Any]] = []
    by_code: dict[str, dict[str, Any]] = {}
    for r in rules:
        if not bool(r.get("enabled", True)):
            continue
        code = _normalize_code(str(r.get("code") or ""))
        if not code or _is_course_like_code(code):
            continue
        if code in by_code:
            continue
        pc_raw = r.get("parent_code")
        parent_code = _normalize_code(str(pc_raw)) if pc_raw is not None and str(pc_raw).strip() else None
        if parent_code and parent_code not in enabled_rule_codes:
            parent_code = None
        req_rt = str(r.get("requirement_type") or "required").lower()
        if req_rt not in ("required", "elective", "optional", "practice", "pe"):
            req_rt = "required"
        vt = str(r.get("value_type") or "credits").lower()
        if vt not in ("credits", "count", "hours"):
            vt = "credits"
        item = {
            "code": code,
            "label_hu": (str(r.get("label_hu") or code).strip() or code)[:255],
            "requirement_type": req_rt,
            "value_type": vt,
            "min_value": _coerce_rule_min_value(r.get("min_value")),
            "include_in_total": bool(r.get("include_in_total", True)),
            "parent_code": parent_code,
            "is_specialization_root": bool(r.get("is_specialization_root", False)),
        }
        by_code[code] = item
        enabled_rules.append(item)

    snapshot_id = create_major_import_snapshot(db, major_id=major_id, source_kod=kod)
    db.query(models.CourseMajor).filter(models.CourseMajor.major_id == major_id).delete(synchronize_session=False)
    db.query(models.MajorRequirementRule).filter(models.MajorRequirementRule.major_id == major_id).delete(
        synchronize_session=False
    )
    db.flush()

    rules_created = ensure_major_requirement_rules(db, major_id, enabled_rules)
    _apply_aggregate_parent_rule_include_flags(db, major_id)

    created_courses = 0
    created_cm = 0
    updated_cm = 0
    errors: list[str] = []
    valid_rule_codes = set(by_code.keys())

    try:
        rows_skipped = 0
        rows_eligible = 0
        for r in rows:
            code = _normalize_code(str(r.get("course_code") or ""))
            if not code:
                continue
            existing_course = _get_existing_course_by_alias(db, code)
            
            
            if r.get("import_as_course") is False and not existing_course:
                rows_skipped += 1
                continue
            rows_eligible += 1
            try:
                if existing_course is not None:
                    c, cnew = existing_course, False
                else:
                    c, cnew = _get_or_create_course(db, code, str(r.get("name") or code))
                if cnew:
                    created_courses += 1
                subgroup = str(r.get("subgroup_major") or r.get("subgroup") or "").strip().upper() or None
                if subgroup and subgroup not in valid_rule_codes:
                    subgroup = None
                
                row_name = str(r.get("name") or "")
                if not subgroup and "MK-SZD" in valid_rule_codes and _looks_like_thesis_row(code, row_name):
                    subgroup = "MK-SZD"
                if not subgroup and "MK-SZG" in valid_rule_codes and _looks_like_practice_row(code, row_name):
                    subgroup = "MK-SZG"
                cm_type = str(r.get("type") or "required")
                if subgroup and subgroup in by_code:
                    rt = str(by_code[subgroup].get("requirement_type") or cm_type).lower()
                    if rt in ("required", "elective", "optional"):
                        cm_type = rt
                if subgroup == "MK-SZG":
                    cm_type = "practice"
                action, _ = _upsert_course_major(
                    db,
                    c.id,
                    major_id,
                    int(r.get("credit") or 0),
                    int(r.get("semester") or 1),
                    cm_type,
                    subgroup,
                )
                if action == "created":
                    created_cm += 1
                else:
                    updated_cm += 1
            except Exception as ex:  # noqa: BLE001
                errors.append(f"{code}: {ex}")

        bf_created, bf_updated = _backfill_key_blocks_course_major(
            db,
            major_id=major_id,
            valid_rule_codes=valid_rule_codes,
        )
        created_cm += bf_created
        updated_cm += bf_updated
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "major_id": major_id,
        "kod": kod,
        "import_snapshot_id": snapshot_id,
        "rules": {"rules_created_in_db": rules_created, "rules_enabled": len(enabled_rules)},
        "import": {
            "rows_total": len(rows),
            "rows_eligible": rows_eligible,
            "rows_skipped_by_editor": rows_skipped,
            "courses_created": created_courses,
            "course_major_created": created_cm,
            "course_major_updated": updated_cm,
            "errors": errors[:_ERRORS_SAMPLE_N],
        },
        "note": "Szerkesztett terv alkalmazva az adatbázisra.",
    }
