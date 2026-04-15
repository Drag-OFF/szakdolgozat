"""
Neptun ``tanterv.aspx`` HTML feldolgozása: tárgysorok + felfedezett követelmény-blokk szabályok.

**Csak parse**, adatbázis írás nélkül. Kimenet: kurzus rekordok (kód, név, félév, típus, szabályhoz kötés)
és ``discovered`` szabálylista a ``major_requirement_rules`` feltöltéséhez.

**Konstans jelölések:** ``_PRACTICE_BLOCK_CODES`` szakmai gyakorlat jelleg (kredit gyakran 0, követelmény órában).
``_COURSE_CODE_DASH_SHAPE_RE`` kurzuskód + kötőjeles utótag (nem MK-* követelménycsoport).
"""

from __future__ import annotations

import json
import re
import unicodedata
from types import SimpleNamespace
from typing import Any

from bs4 import BeautifulSoup

_DEFAULT_SKIP_CODES = frozenset({"SZAKM", "SZV", "MK-ISZKT"})
_KNOWN_LETTER_BLOCK_CODES = frozenset({"SZAKM", "SZV", "SZAKD", "SZAKMGY"})
_PRACTICE_BLOCK_CODES = frozenset({"SZAKMGY", "SZGY", "MK-SZG"})
_NEPTUN_AGGREGATE_PARENT_CODES = frozenset({"SZAKM", "KKV"})
_COURSE_CODE_SHAPE_RE = re.compile(r"^[A-Z]{2,12}\d{2,6}[A-Z]{0,4}$", re.I)
_COURSE_CODE_DASH_SHAPE_RE = re.compile(
    r"^[A-Z]{2,12}\d{2,6}[A-Z]{0,4}-[A-Z0-9]{1,20}(?:-[A-Z0-9]+)*$",
    re.I,
)
_RE_UNCLOSED_LEADING_TD = re.compile(
    r"(<[Tt][Dd][^>]*align\s*=\s*center[^>]*>)\s*(<[Tt][Dd])",
)
_BLOCK_MARKERS = frozenset(
    {
        "◼",
        "■",
        "▪",
        "▫",
        "◻",
        "◾",
        "⬛",
        "⬜",
        "\u25aa",
        "\u25a0",
        "\u25ab",
    }
)


def _fix_neptun_malformed_td_cells(html: str) -> str:
    return _RE_UNCLOSED_LEADING_TD.sub(r"\1</td>\2", html)


def _norm_header(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", s.strip().lower())


def _get_neptun_cell_text(td) -> str:
    if td is None:
        return ""
    return re.sub(r"\s+", " ", td.get_text(separator=" ", strip=True) or "").strip()


def _strip_neptun_ui_cell_text(s: str) -> str:
    s = re.sub(r"\s+", " ", (s or "").strip())
    return s


def _normalize_neptun_code_cell(raw: str) -> str:
    s = (raw or "").strip()
    s = s.replace("\u2011", "-").replace("\u2013", "-").replace("\u2212", "-")
    s = re.sub(r"\s+", "", s)
    return s.upper()


def _extract_block_depth_and_code(raw: str) -> tuple[int, str]:
    s = str(raw or "").strip()
    depth = 0
    while s and s[0] in _BLOCK_MARKERS:
        depth += 1
        s = s[1:].lstrip()
    return depth, _normalize_neptun_code_cell(s)


_RE_PADDING_LEFT_PX = re.compile(r"padding-left\s*:\s*(\d+)\s*px", re.I)


def _padding_depth_from_style(*elements) -> int:
    """Neptun néha csak px behúzással jelzi a szintet (◼ nincs a szövegben)."""
    best = 0
    for el in elements:
        if el is None:
            continue
        st = el.get("style") or ""
        m = _RE_PADDING_LEFT_PX.search(st)
        if m:
            px = int(m.group(1))
            best = max(best, min(40, px // 16))
    return best


def _merge_marker_and_padding_depth(marker_depth: int, code_td, tr) -> int:
    """
    Ha van ◼ a szövegben, csak az számít; a padding-left max() korábban TT sorokat +1 szinttel
    vitte (pl. TT-MBNXK311 TE alá került MK helyett).
    """
    pad = _padding_depth_from_style(code_td, tr)
    if marker_depth > 0:
        return marker_depth
    return pad


def _tt_parent_for_te_code(te_code: str) -> str | None:
    """TE-MBNXK111E / TE-MBNXK111G → TT-MBNXK111 (közös TT ág a testvér TE soroknak)."""
    u = (te_code or "").strip().upper().replace(" ", "")
    if not u.startswith("TE-"):
        return None
    rest = u[3:]
    rest = re.sub(r"[EGB]$", "", rest)
    return f"TT-{rest}" if rest else None


def _mk_root_ancestor_for_te(te_code: str, by_code: dict[str, dict[str, Any]]) -> str | None:
    """TE-* felfelé a láncban az első MK-* szülő (pl. MK-ALA)."""
    cur = by_code.get((te_code or "").strip().upper())
    if not cur:
        return None
    seen = 0
    while cur and seen < 300:
        pc = cur.get("parent_code")
        if not pc:
            c = str(cur.get("code") or "").strip().upper()
            return c if c.startswith("MK-") else None
        p = str(pc).strip().upper()
        if p.startswith("MK-"):
            return p
        cur = by_code.get(p)
        seen += 1
    return None


def _normalize_discovered_rule_parents(discovered: list[dict[str, Any]]) -> None:
    """
    Neptun HTML + stack hibák javítása:
    1) TE testvérek (uganaz a TT ág) ne legyenek egymás gyerekei → szülő: TT-*.
    2) TT-* sor szülője ne legyen TE-* (pl. következő tárgy TT blokk) → szülő: a TE ág MK gyökere (MK-ALA).
    """
    if not discovered:
        return
    for d in discovered:
        code = str(d.get("code") or "").strip().upper()
        pc = d.get("parent_code")
        if not pc or not code.startswith("TE-"):
            continue
        if str(pc).strip().upper().startswith("TE-"):
            tt = _tt_parent_for_te_code(code)
            if tt:
                codes = {str(x.get("code") or "").strip().upper() for x in discovered}
                if tt in codes:
                    d["parent_code"] = tt
    by_code: dict[str, dict[str, Any]] = {
        str(d.get("code") or "").strip().upper(): d for d in discovered if d.get("code")
    }
    for d in discovered:
        code = str(d.get("code") or "").strip().upper()
        pc = d.get("parent_code")
        if not pc or not code.startswith("TT-"):
            continue
        if str(pc).strip().upper().startswith("TE-"):
            mk = _mk_root_ancestor_for_te(str(pc).strip().upper(), by_code)
            if mk and mk in by_code:
                d["parent_code"] = mk


def _normalize_row_parent_rule_codes(rows_out: list[dict[str, Any]], discovered: list[dict[str, Any]]) -> None:
    """Kurzus sorok parent_rule_code igazítása a javított szabályokhoz (TE → TT)."""
    codes = {str(d.get("code") or "").strip().upper() for d in discovered if d.get("code")}
    for r in rows_out:
        prc = (r.get("parent_rule_code") or "").strip().upper()
        if not prc.startswith("TE-"):
            continue
        tt = _tt_parent_for_te_code(prc)
        if tt and tt in codes:
            r["parent_rule_code"] = tt


def _best_code_raw_for_markers(*candidates: str) -> str:
    """Olyan szöveget választ, amiben a ◼ mélység a legnagyobb (ne max(hossz) dobja el)."""
    best = ""
    best_key = (-1, -1)
    for c in candidates:
        if not (c or "").strip():
            continue
        d, _ = _extract_block_depth_and_code(c)
        key = (d, len(c))
        if key > best_key:
            best_key = key
            best = c
    return best.strip() if best else ""


def _parse_int_cell(s: str) -> int:
    t = re.sub(r"[^\d\-]", "", s or "")
    if not t or t == "-":
        return 0
    try:
        return int(t)
    except ValueError:
        return 0


def _parse_hours_cell(s: str) -> int:
    """Heti / féléves óra cella — első pozitív egész (pl. „2”, „2/0”)."""
    t = (s or "").strip().replace(",", ".")
    if not t or t in "-–—·":
        return 0
    m = re.search(r"(\d+)", t)
    return int(m.group(1)) if m else 0


def _parent_rule_code_for_depth(stack: list[tuple[int, str]], depth: int) -> str | None:
    """◼ mélység alapján: a közvetlen szülő követelmény-sorkód (stack másolat, nem módosít)."""
    snap = list(stack)
    while snap and snap[-1][0] >= depth:
        snap.pop()
    return snap[-1][1] if snap else None


_NEPTUN_GROUP_PARENT_PREFIXES = ("TT-", "TE-", "KTUDSZ-")


def _parent_is_neptun_variant_group(code: str | None) -> bool:
    """TT/TE/KTUDSZ sorok a Neptunban csoportosítók; a valódi tárgykód a kurzus sorban van (pl. IBK301E)."""
    c = (code or "").strip().upper()
    return c.startswith(_NEPTUN_GROUP_PARENT_PREFIXES)


def _neptun_concrete_course_from_hours(
    weekly: int,
    semester_h: int,
    *,
    heti_col_present: bool,
) -> bool | None:
    """
    Ha van heti óra oszlop és mindkettő 0 → valószínűleg nem konkrét tárgy (pl. TE-* változat sor).
    Oszlop hiánya → None (nem kényszerítünk default importot).
    """
    if not heti_col_present:
        return None
    if weekly > 0 or semester_h > 0:
        return True
    return False


def _parse_semester_cell(s: str) -> int:
    m = re.search(r"(\d+)", s or "")
    return int(m.group(1)) if m else 1


def _row_cell_texts(tr) -> list[str]:
    return [_get_neptun_cell_text(td) for td in tr.find_all(["td", "th"])]


def _unwrap_neptun_row_tds(tr, need: int) -> list:
    tds = tr.find_all("td", recursive=False)
    if len(tds) >= need:
        return tds[:need]
    inner = tr.find_all("td")
    return inner[: max(need, len(inner))]


def _is_neptun_inner_subtable_row(tr) -> bool:
    tds = tr.find_all("td", recursive=False)
    if len(tds) != 1:
        return False
    td = tds[0]
    return bool(td.find("table"))


def _get_neptun_code_cell_text(code_td) -> str:
    """
    Sorkód cella: a ◼ jelek gyakran külön span/td-ban vannak; a leghosszabb részstring
    (régi logika) eldobta őket → mindig 0 mélység. Először a teljes cellaszöveg + összefűzött alcellák.
    """
    if code_td is None:
        return ""
    full = _get_neptun_cell_text(code_td)
    parts: list[str] = []
    for sub in code_td.find_all(["td", "th"], recursive=True):
        if sub.find("img") and not sub.get_text(strip=True):
            continue
        t = _get_neptun_cell_text(sub)
        if t:
            parts.append(t)
    merged = "".join(parts) if parts else ""
    legacy_long = max(parts, key=len) if parts else ""
    best = _best_code_raw_for_markers(full, merged, legacy_long, full.replace(" ", ""))
    return best if best else (full or merged or legacy_long or "")


def _title_from_td(td) -> str:
    img = td.find("img") if td else None
    if img and (img.get("title") or img.get("alt")):
        return (img.get("title") or img.get("alt") or "").strip()
    return ""


def _detect_header_map(cells: list[str]) -> dict[str, int] | None:
    if len(cells) < 5:
        return None
    joined = [_norm_header(c) for c in cells]
    j = " ".join(joined)
    if "sorkod" not in j and "kod" not in j and "targykod" not in j:
        return None
    m: dict[str, int] = {}
    for i, h in enumerate(joined):
        if "sorkod" in h or h == "kod" or "targykod" in h:
            m["code"] = i
        elif "nev" in h and "teljesitendo" not in h and "targy" not in h:
            m["name"] = i
        elif "heti" in h and ("ora" in h or "óra" in h or "orasz" in h):
            m["heti_oras"] = i
        elif "feleves" in h and ("ora" in h or "óra" in h or "orasz" in h):
            m["feleves_oras"] = i
        elif ("felev" in h or "semester" in h) and "feleves" not in h:
            m["semester"] = i
        elif "felvetel" in h:
            m["felvetel"] = i
        elif "kurus" in h or "kurzus" in h and "tipus" in h:
            m["kurustipus"] = i
        elif "kredit" in h and "ebb" not in h and "teljesitendo" not in h:
            if "credit" not in m:
                m["credit"] = i
        elif "teljesitendo" in h and "csoport" in h:
            m["teljesitendo_csoport"] = i
    if "code" not in m or "name" not in m:
        return None
    return m


def _repair_neptun_header_map(hm: dict[str, int], ncols: int) -> dict[str, int]:
    out = dict(hm)
    ci = out.get("code")
    if ci is None or ncols < 6:
        return out
    ni = out.get("name")
    if ni is not None and ni > ci + 3:
        out["name"] = min(ci + 1, ncols - 1)
    if out.get("semester") is not None and out["semester"] > ci + 5:
        out["semester"] = min(ci + 2, ncols - 1)
    if out.get("felvetel") is not None and out["felvetel"] > ci + 6:
        out["felvetel"] = min(ci + 3, ncols - 1)
    if out.get("kurustipus") is not None and out["kurustipus"] > ci + 7:
        out["kurustipus"] = min(ci + 4, ncols - 1)
    if out.get("heti_oras") is None and ci is not None:
        out["heti_oras"] = min(ci + 5, ncols - 1)
    if out.get("feleves_oras") is None and ci is not None:
        out["feleves_oras"] = min(ci + 6, ncols - 1)
    if out.get("credit") is not None and out["credit"] > ci + 12:
        out["credit"] = min(ci + 8, ncols - 1)
    if out.get("teljesitendo_csoport") is not None and out["teljesitendo_csoport"] > ci + 13:
        out["teljesitendo_csoport"] = min(ci + 9, ncols - 1)
    return out


def _find_header_map(soup: BeautifulSoup) -> dict[str, int] | None:
    for tr in soup.find_all("tr"):
        cells = _row_cell_texts(tr)
        if len(cells) < 5:
            continue
        hm = _detect_header_map(cells)
        if hm:
            return _repair_neptun_header_map(hm, len(cells))
    return None


def _pick_credit_column_index(rows: list[list[str]], ncols: int) -> int:
    best_j, best_sc = min(7, ncols - 1), -1
    for j in range(4, min(ncols, 14)):
        sc = 0
        for cells in rows[:100]:
            if j >= len(cells):
                continue
            v = _parse_int_cell(cells[j])
            if 0 < v <= 200:
                sc += 1
        if sc > best_sc:
            best_sc, best_j = sc, j
    return best_j


def _infer_column_map(soup: BeautifulSoup) -> dict[str, int] | None:
    rows: list[list[str]] = []
    for tr in soup.find_all("tr"):
        tds = _unwrap_neptun_row_tds(tr, 8)
        if len(tds) < 8:
            continue
        cells = [_get_neptun_cell_text(td) for td in tds]
        if _detect_header_map(cells):
            continue
        joined = " ".join(_norm_header(c) for c in cells)
        if "sorkod" in joined and ("nev" in joined or "neve" in joined):
            continue
        rows.append(cells)
    if len(rows) < 5:
        return None
    ncols = max(len(r) for r in rows)
    best_ci, best_sc = 0, -1
    empty_set: set[str] = set()
    for ci in range(min(6, ncols)):
        sc = 0
        for cells in rows[:200]:
            if ci >= len(cells):
                continue
            raw = _normalize_neptun_code_cell(cells[ci])
            if not raw:
                continue
            if (
                _looks_like_course_code(raw, empty_set)
                or _looks_like_block_header(raw, empty_set)
                or raw in _DEFAULT_SKIP_CODES
            ):
                sc += 1
        if sc > best_sc:
            best_sc, best_ci = sc, ci
    if best_sc < max(8, len(rows) // 6):
        return None
    cri = _pick_credit_column_index(rows, ncols)
    return {
        "code": best_ci,
        "name": min(best_ci + 1, ncols - 1),
        "semester": min(best_ci + 2, ncols - 1),
        "felvetel": min(best_ci + 3, ncols - 1),
        "kurustipus": min(best_ci + 4, ncols - 1) if best_ci + 4 < ncols else best_ci + 3,
        "credit": min(cri, ncols - 1),
    }


def _looks_like_course_code(code: str, _rc: set[str]) -> bool:
    if not code or len(code) < 4:
        return False
    return bool(_COURSE_CODE_SHAPE_RE.match(code))


def _looks_like_block_header(code: str, rc: set[str]) -> bool:
    """
    Követelmény blokk fejléc (MK-DIF-MATSZT, MK-S-MOD stb.), nem kurzuskód: több kötőjeles szabálykód.
    """
    if not code:
        return False
    if code in rc:
        return True
    if code in _KNOWN_LETTER_BLOCK_CODES:
        return True
    if _COURSE_CODE_DASH_SHAPE_RE.fullmatch(code):
        return False
    if re.fullmatch(r"[A-Z]{2,10}(?:-[A-Z0-9]{1,32})+", code):
        return True
    if re.match(r"^[A-Z]{2,10}-[A-Z0-9]{1,10}$", code):
        return True
    return False


def _match_rule_code_in_text(text: str, effective: dict[str, Any]) -> str | None:
    t = (text or "").upper()
    for k in sorted(effective.keys(), key=len, reverse=True):
        if k and k in t:
            return k
    return None


def _map_rule_type_from_row(felv: str, kur: str, *, label: str = "", code: str = "") -> str:
    s = f"{felv} {kur} {label}".lower()
    c = (code or "").strip().upper()
    if c in _PRACTICE_BLOCK_CODES:
        return "practice"
    if any(x in s for x in ("szakmai gyakorlat", "szakmaigyakorlat", "szakmai gyakorlatot")):
        return "practice"
    if any(x in s for x in ("testnevelés", "testneveles", "félév tn", "felev tn")):
        return "pe"
    if any(x in s for x in ("szabadon", "szabvál", "szabval", "optional")):
        return "optional"
    if any(x in s for x in ("kötelezően választható", "kotelezoen valaszthato", "kötvál", "kotval", "elective")):
        return "elective"
    return "required"


def _discovered_block_min_value_and_value_type(
    code: str,
    label: str,
    felv: str,
    kur: str,
    cells: list[str],
    col: dict[str, int],
    *,
    requirement_type: str,
) -> tuple[int, str]:
    """
    Blokksor követelmény: alapból kredit oszlop; szakmai gyakorlatnál gyakori, hogy kredit=0, óra>0.
    """
    cri = col.get("credit")
    credit = _parse_int_cell(cells[cri]) if cri is not None and cri < len(cells) else 0
    fovi = col.get("feleves_oras")
    hi = col.get("heti_oras")
    feleves = _parse_hours_cell(cells[fovi]) if fovi is not None and fovi < len(cells) else 0
    weekly = _parse_hours_cell(cells[hi]) if hi is not None and hi < len(cells) else 0
    rt = (requirement_type or "required").lower()
    if rt == "practice":
        if feleves > 0:
            return feleves, "hours"
        if weekly > 0:
            return weekly, "hours"
        if credit > 0:
            return credit, "credits"
        return 0, "hours"
    if rt == "pe":
        if credit > 0:
            return credit, "count"
        return 0, "count"
    return max(0, credit), "credits"


def _synthetic_rule(code: str, label_hu: str, req_type: str) -> Any:
    sn = SimpleNamespace()
    sn.code = code
    sn.label_hu = label_hu
    sn.requirement_type = req_type
    sn.subgroup = code
    return sn


def _discovered_include_in_total_for_code(code: str) -> bool:
    if code in _NEPTUN_AGGREGATE_PARENT_CODES:
        return False
    return True


def _resolve_course_major_type_from_row_and_rule(felv: str, kur: str, rule: Any | None) -> tuple[str, str | None, str | None]:
    f = (felv or "").lower()
    k = (kur or "").lower()
    combined = f"{f} {k}"
    if any(x in combined for x in ("szabadon", "szabvál", "optional")):
        return "optional", (rule.subgroup if rule else None), (rule.code if rule else None)
    if any(
        x in combined
        for x in (
            "kötelezően választható",
            "kotelezoen valaszthato",
            "kötvál",
            "kotval",
            "választható",
            "elective",
        )
    ):
        return "elective", (rule.subgroup if rule else None), (rule.code if rule else None)
    if rule:
        rt = (rule.requirement_type or "required").lower()
        if rt == "elective":
            return "elective", rule.subgroup, rule.code
        if rt == "optional":
            return "optional", rule.subgroup, rule.code
        if rt == "practice":
            return "practice", rule.subgroup, rule.code
        if rt == "pe":
            return "pe", rule.subgroup, rule.code
    return "required", (rule.subgroup if rule else None), (rule.code if rule else None)


def _resolve_credit_value(cells: list[str], cri: int | None) -> int:
    if cri is None or cri >= len(cells):
        return 0
    return max(0, _parse_int_cell(cells[cri]))


def _felv_is_emptyish(felv: str) -> bool:
    """Felvétel típus üres / csak elválasztó — folytatás-sorban gyakori zaj."""
    s = (felv or "").strip()
    if not s:
        return True
    if s in ("-", "–", "—", "·", "*"):
        return True
    return False


def _resolve_course_display_name(cells: list[str], tds, col: dict[str, int], code: str) -> str:
    ni = col.get("name")
    if ni is not None and ni < len(cells):
        stripped = _strip_neptun_ui_cell_text(cells[ni])
        if stripped:
            return stripped
        td = tds[ni] if ni < len(tds) else None
        tt = _title_from_td(td) if td else ""
        if tt:
            return tt
    return code


def _is_neptun_spurious_duplicate_course_row(
    code: str,
    raw_name_cell: str,
    felv: str,
    credit: int,
    *,
    name_td=None,
) -> bool:
    """
    Folytatás / dupla sor: név cella üres vagy megismétli a kódot; felvétel üres; kredit 0.
    A kód vs. név összevetés ugyanazzal a normalizálással történik, mint a tárgykód cellánál.
    Ha a név csak img title/alt-ban van és nem kódszerű, nem szűrjük ki.
    """
    if not _felv_is_emptyish(felv):
        return False
    if credit > 0:
        return False
    code_n = _normalize_neptun_code_cell(code)
    if not code_n:
        return False

    tt = (_title_from_td(name_td) or "").strip() if name_td else ""
    if tt and _normalize_neptun_code_cell(tt) != code_n:
        return False

    raw_s = (raw_name_cell or "").strip()
    if not raw_s:
        return True

    return _normalize_neptun_code_cell(raw_s) == code_n


def _extract_row_ctl_id(tr) -> str | None:
    rid = str(tr.get("id") or "").strip()
    if not rid:
        return None
    m = re.search(r"(\d{5,})", rid)
    if not m:
        return None
    return m.group(1)


def _dedupe_discovered_rules(discovered: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_code: dict[str, dict[str, Any]] = {}
    for d in discovered:
        c = (d.get("code") or "").upper()
        if c:
            by_code[c] = d
    return list(by_code.values())


def parse_tanterv_full(
    html: str,
    existing_rules: dict[str, Any],
) -> tuple[list[dict[str, Any]], dict[str, Any], list[dict[str, Any]]]:
    effective: dict[str, Any] = {k: v for k, v in existing_rules.items()}
    discovered: list[dict[str, Any]] = []
    html = _fix_neptun_malformed_td_cells(html)
    soup = BeautifulSoup(html, "html.parser")
    header_explicit = _find_header_map(soup)
    header_map = header_explicit or _infer_column_map(soup)

    if not header_map:
        return _parse_full_fallback(soup, effective, discovered)

    rows_out: list[dict[str, Any]] = []
    skipped = 0
    current_category: str | None = None
    category_stack: list[tuple[int, str]] = []
    col = header_map
    max_idx = max(col.values())

    def _effective_codes() -> set[str]:
        return set(effective.keys())

    need = max_idx + 1
    for tr in soup.find_all("tr"):
        if _is_neptun_inner_subtable_row(tr):
            continue
        tds = _unwrap_neptun_row_tds(tr, need)
        if len(tds) < 2:
            continue
        cells = [_get_neptun_cell_text(td) for td in tds]
        while len(cells) < need:
            cells.append("")
        if _detect_header_map(cells):
            continue

        ci = col["code"]
        code_td = tds[ci] if ci < len(tds) else None
        code_raw = _get_neptun_code_cell_text(code_td)
        depth, code = _extract_block_depth_and_code(code_raw)
        depth = _merge_marker_and_padding_depth(depth, code_td, tr)
        rcodes = _effective_codes()

        if code in effective:
            while category_stack and category_stack[-1][0] >= depth:
                category_stack.pop()
            category_stack.append((depth, code))
            current_category = code
            continue

        if _looks_like_block_header(code, rcodes):
            ni = col["name"]
            label = _strip_neptun_ui_cell_text(cells[ni] if ni < len(cells) else "") or code
            if ni < len(tds):
                tt = _title_from_td(tds[ni])
                if tt:
                    label = tt
            fi = col.get("felvetel")
            felv = cells[fi] if fi is not None and fi < len(cells) else ""
            ki = col.get("kurustipus")
            kur = cells[ki] if ki is not None and ki < len(cells) else ""
            rt = _map_rule_type_from_row(felv, kur, label=label, code=code)
            min_val, value_type = _discovered_block_min_value_and_value_type(
                code, label, felv, kur, cells, col, requirement_type=rt
            )
            effective[code] = _synthetic_rule(code, label, rt)
            while category_stack and category_stack[-1][0] >= depth:
                category_stack.pop()
            parent_code = category_stack[-1][1] if category_stack else None
            category_stack.append((depth, code))
            discovered.append(
                {
                    "code": code,
                    "label_hu": (label or code)[:255],
                    "requirement_type": rt,
                    "min_value": min_val,
                    "value_type": value_type,
                    "include_in_total": _discovered_include_in_total_for_code(code),
                    "depth": depth,
                    "parent_code": parent_code,
                }
            )
            current_category = code
            continue

        if (code in _DEFAULT_SKIP_CODES or not code) and not _looks_like_course_code(code, rcodes):
            skipped += 1
            continue

        if not _looks_like_course_code(code, rcodes):
            skipped += 1
            continue

        si = col.get("semester")
        semester = _parse_semester_cell(cells[si]) if si is not None and si < len(cells) else 1
        fi = col.get("felvetel")
        felv = cells[fi] if fi is not None and fi < len(cells) else ""
        ki = col.get("kurustipus")
        kur = cells[ki] if ki is not None and ki < len(cells) else ""
        ni_name = col.get("name")
        raw_name_cell = (
            _strip_neptun_ui_cell_text(cells[ni_name]) if ni_name is not None and ni_name < len(cells) else ""
        )
        name_td = tds[ni_name] if ni_name is not None and ni_name < len(tds) else None
        cri = col.get("credit")
        credit = _resolve_credit_value(cells, cri)
        if _is_neptun_spurious_duplicate_course_row(code, raw_name_cell, felv, credit, name_td=name_td):
            skipped += 1
            continue

        name = _resolve_course_display_name(cells, tds, col, code)

        tci = col.get("teljesitendo_csoport")
        group_from_cell: str | None = None
        if tci is not None and tci < len(cells):
            group_from_cell = _match_rule_code_in_text(cells[tci], effective)

        rule: Any | None = None
        if group_from_cell:
            rule = effective.get(group_from_cell)
        if rule is None and category_stack:
            rule = effective.get(category_stack[-1][1])
        if rule is None and current_category:
            rule = effective.get(current_category)

        ctype, subgroup, mrc = _resolve_course_major_type_from_row_and_rule(felv, kur, rule)

        hi = col.get("heti_oras")
        fovi = col.get("feleves_oras")
        weekly_hours = _parse_hours_cell(cells[hi]) if hi is not None and hi < len(cells) else 0
        semester_hours = _parse_hours_cell(cells[fovi]) if fovi is not None and fovi < len(cells) else 0
        heti_col_present = hi is not None and hi < len(cells)
        parent_rule_code = _parent_rule_code_for_depth(category_stack, depth)
        heuristic_course = _neptun_concrete_course_from_hours(
            weekly_hours, semester_hours, heti_col_present=heti_col_present
        )

        rows_out.append(
            {
                "course_code": code,
                "name": (name or code).strip() or code,
                "semester": semester,
                "credit": credit,
                "type": ctype,
                "subgroup": subgroup,
                "row_ctl_id": _extract_row_ctl_id(tr),
                "raw_felvetel_tipus": felv,
                "matched_rule_code": mrc,
                "block_depth": depth,
                "parent_rule_code": parent_rule_code,
                "parent_rule_is_neptun_group": _parent_is_neptun_variant_group(parent_rule_code),
                "weekly_hours": weekly_hours,
                "semester_hours": semester_hours,
                "heuristic_neptun_concrete_course": heuristic_course,
            }
        )

    discovered = _dedupe_discovered_rules(discovered)
    _normalize_discovered_rule_parents(discovered)
    _normalize_row_parent_rule_codes(rows_out, discovered)
    for r in rows_out:
        r["parent_rule_is_neptun_group"] = _parent_is_neptun_variant_group(r.get("parent_rule_code"))
    meta = {
        "header_found": True,
        "header_inferred": header_explicit is None,
        "column_map": col,
        "skipped_rows": skipped,
        "parsed_count": len(rows_out),
        "rule_codes_loaded": len(existing_rules),
        "rules_discovered_new": len(discovered),
        "has_heti_hours_column": col.get("heti_oras") is not None,
    }
    return rows_out, meta, discovered


def _parse_full_fallback(
    soup: BeautifulSoup,
    effective: dict[str, Any],
    discovered: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], dict[str, Any], list[dict[str, Any]]]:
    rows_out: list[dict[str, Any]] = []
    skipped = 0
    current_category: str | None = None
    category_stack: list[tuple[int, str]] = []

    def _codes() -> set[str]:
        return set(effective.keys())

    for tr in soup.find_all("tr"):
        if _is_neptun_inner_subtable_row(tr):
            continue
        tds = _unwrap_neptun_row_tds(tr, 8)
        if len(tds) < 8:
            skipped += 1
            continue
        cells = [_get_neptun_cell_text(td) for td in tds]
        if _detect_header_map(cells):
            continue
        col_code = 1 if len(cells) > 1 and not cells[0].strip() else 0
        code_td = tds[col_code] if col_code < len(tds) else None
        code_raw = _get_neptun_code_cell_text(code_td)
        depth, code = _extract_block_depth_and_code(code_raw)
        depth = _merge_marker_and_padding_depth(depth, code_td, tr)
        rc = _codes()

        if code in effective:
            while category_stack and category_stack[-1][0] >= depth:
                category_stack.pop()
            category_stack.append((depth, code))
            current_category = code
            continue

        if _looks_like_block_header(code, rc):
            label = _strip_neptun_ui_cell_text(cells[col_code + 1] if col_code + 1 < len(cells) else "") or code
            felv = cells[col_code + 3] if col_code + 3 < len(cells) else ""
            kur = cells[col_code + 4] if col_code + 4 < len(cells) else ""
            rt = _map_rule_type_from_row(felv, kur, label=label, code=code)
            feleves_fb = (
                _parse_hours_cell(cells[col_code + 6])
                if col_code + 6 < len(cells)
                else 0
            )
            weekly_fb = (
                _parse_hours_cell(cells[col_code + 5])
                if col_code + 5 < len(cells)
                else 0
            )
            cri_fb = col_code + 7 if col_code + 7 < len(cells) else None
            credit_fb = _resolve_credit_value(cells, cri_fb)
            if rt == "practice":
                if feleves_fb > 0:
                    min_val, value_type = feleves_fb, "hours"
                elif weekly_fb > 0:
                    min_val, value_type = weekly_fb, "hours"
                elif credit_fb > 0:
                    min_val, value_type = credit_fb, "credits"
                else:
                    min_val, value_type = 0, "hours"
            elif rt == "pe":
                min_val, value_type = (credit_fb if credit_fb > 0 else 0), "count"
            else:
                min_val, value_type = max(0, credit_fb), "credits"
            effective[code] = _synthetic_rule(code, label, rt)
            while category_stack and category_stack[-1][0] >= depth:
                category_stack.pop()
            parent_code = category_stack[-1][1] if category_stack else None
            category_stack.append((depth, code))
            discovered.append(
                {
                    "code": code,
                    "label_hu": (label or code)[:255],
                    "requirement_type": rt,
                    "min_value": min_val,
                    "value_type": value_type,
                    "include_in_total": _discovered_include_in_total_for_code(code),
                    "depth": depth,
                    "parent_code": parent_code,
                }
            )
            current_category = code
            continue

        if (code in _DEFAULT_SKIP_CODES or not code) and not _looks_like_course_code(code, rc):
            skipped += 1
            continue

        if not _looks_like_course_code(code, rc):
            skipped += 1
            continue

        semester = _parse_semester_cell(cells[col_code + 2] if col_code + 2 < len(cells) else "")
        felv = cells[col_code + 3] if col_code + 3 < len(cells) else ""
        kur = cells[col_code + 4] if col_code + 4 < len(cells) else ""
        raw_name_cell = _strip_neptun_ui_cell_text(cells[col_code + 1] if col_code + 1 < len(cells) else "")
        name_td_fb = tds[col_code + 1] if col_code + 1 < len(tds) else None
        cri_fb = col_code + 7 if col_code + 7 < len(cells) else None
        credit = _resolve_credit_value(cells, cri_fb)
        if _is_neptun_spurious_duplicate_course_row(code, raw_name_cell, felv, credit, name_td=name_td_fb):
            skipped += 1
            continue

        name = _resolve_course_display_name(cells, tds, {"name": col_code + 1}, code)
        rule = effective.get(category_stack[-1][1]) if category_stack else None
        if rule is None:
            rule = effective.get(current_category) if current_category else None
        ctype, subgroup, mrc = _resolve_course_major_type_from_row_and_rule(felv, kur, rule)
        hi_fb = col_code + 5 if col_code + 5 < len(cells) else None
        fovi_fb = col_code + 6 if col_code + 6 < len(cells) else None
        weekly_hours = _parse_hours_cell(cells[hi_fb]) if hi_fb is not None else 0
        semester_hours = _parse_hours_cell(cells[fovi_fb]) if fovi_fb is not None else 0
        heti_col_present = hi_fb is not None
        parent_rule_code = _parent_rule_code_for_depth(category_stack, depth)
        heuristic_course = _neptun_concrete_course_from_hours(
            weekly_hours, semester_hours, heti_col_present=heti_col_present
        )
        rows_out.append(
            {
                "course_code": code,
                "name": name,
                "semester": semester,
                "credit": credit,
                "type": ctype,
                "subgroup": subgroup,
                "row_ctl_id": _extract_row_ctl_id(tr),
                "raw_felvetel_tipus": felv,
                "matched_rule_code": mrc,
                "block_depth": depth,
                "parent_rule_code": parent_rule_code,
                "parent_rule_is_neptun_group": _parent_is_neptun_variant_group(parent_rule_code),
                "weekly_hours": weekly_hours,
                "semester_hours": semester_hours,
                "heuristic_neptun_concrete_course": heuristic_course,
            }
        )

    discovered = _dedupe_discovered_rules(discovered)
    _normalize_discovered_rule_parents(discovered)
    _normalize_row_parent_rule_codes(rows_out, discovered)
    for r in rows_out:
        r["parent_rule_is_neptun_group"] = _parent_is_neptun_variant_group(r.get("parent_rule_code"))
    meta = {
        "header_found": False,
        "header_inferred": True,
        "column_map": {},
        "skipped_rows": skipped,
        "parsed_count": len(rows_out),
        "rule_codes_loaded": len({k for k in effective if k not in [d.get("code") for d in discovered]}),
        "rules_discovered_new": len(discovered),
        "has_heti_hours_column": True,
    }
    return rows_out, meta, discovered
