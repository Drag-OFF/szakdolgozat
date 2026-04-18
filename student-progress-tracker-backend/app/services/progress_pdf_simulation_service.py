"""
Admin PDF "what-if" ellenőrzés:
- több PDF feldolgozása egyszerre (memóriában),
- kurzuskódok kinyerése,
- felhasználóhoz rendelés fájlnév alapján,
- hipotetikus "ha ezeket is teljesítettnek vennénk" requirements állapot.

Fontos: NEM ír adatot adatbázisba, NEM ment fájlt lemezre.
"""

from __future__ import annotations

import io
import re
import unicodedata
from collections import defaultdict
from datetime import date
from typing import Any

from pypdf import PdfReader
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import models
from app.services.requirements_service import get_user_requirements, get_user_requirements_with_completed_courses

try:
    import pdfplumber
except Exception:  
    pdfplumber = None

_COURSE_CODE_RE = re.compile(
    r"\b([A-Z]{2,6}(?:_[A-Z][A-Z0-9]{1,24})?(?:-\d{3,6}|\d{2,8})[A-Z0-9]{0,8}(?:-[A-Z0-9]{1,20})?)\b",
    re.I,
)
_LEGACY_TE_SUFFIX_RE = re.compile(r"^([A-Z]{2,12}\d{2,6}[A-Z]{0,4})-TE$", re.I)
_SPLIT_SUFFIX_RE = re.compile(r"\b([A-Z]{2,12}\d{2,8}[A-Z0-9]{0,8})\s+([EG])\b", re.I)
_XSH_SPLIT_RE = re.compile(r"\b(XSH)\s*[_-]\s*([A-Z][A-Z0-9]{1,24})\s*[-_]\s*(\d{3,6})\b", re.I)
_XSH_LOOSE_RE = re.compile(r"\b(XSH)\s*[_\-\s]?\s*([A-Z][A-Z0-9]{1,24})\s*[_\-\s]\s*(\d{3,6})\b", re.I)
_DOB_LABELED_RE = re.compile(
    r"(date\s*of\s*birth|birth\s*date|sz[uü]let[ée]si\s*d[áa]tum)\D{0,24}(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})",
    re.I,
)

_PERSON_STRIP_HINTS = (
    "teljesített kurzusok",
    "teljesitett kurzusok",
    "teljesített kreditek",
    "teljesitett kreditek",
    "felvett kreditek",
    "felvett kurzusok",
    "completed credits",
    "completed courses",
    "enrolled credits",
    "enrolled courses",
)


def _normalize_text_for_match(s: str) -> str:
    """
    Szabad szöveg normalizálása stabil név- és kulcsillesztéshez.

    Paraméterek:
        s: Nyers bemeneti szöveg.

    Visszatérés:
        Kisbetűs, ékezetmentes, egységes szóközökkel tisztított sztring.
    """
    t = unicodedata.normalize("NFKD", str(s or ""))
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    t = re.sub(r"\s+", " ", t.strip().lower())
    return t


def _normalize_course_name_for_compare(s: str) -> str:
    """
    Kurzusnév normalizálása szigorú név-összehasonlításhoz.

    Paraméterek:
        s: Nyers kurzusnév.

    Visszatérés:
        Ékezetmentes, kisbetűs, csak alfanumerikus karaktereket tartalmazó sztring.
    """
    t = unicodedata.normalize("NFKD", str(s or ""))
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    t = t.lower()
    t = re.sub(r"[^a-z0-9]+", "", t)
    return t


def _canonicalize_course_code(raw: str) -> str:
    """
    Kurzuskód kanonizálása belső, egységes formára.

    Paraméterek:
        raw: Nyers kód, szóközökkel vagy régi utótagos alakban.

    Visszatérés:
        Normalizált, nagybetűs kurzuskód.
    """
    s = re.sub(r"\s+", "", str(raw or "").strip().upper())
    m = _LEGACY_TE_SUFFIX_RE.fullmatch(s)
    if m:
        return m.group(1).upper()
    return s


def _compact_code(s: str) -> str:
    """
    Kód/szöveg tömörítése laza egyezéshez.

    Paraméterek:
        s: Bemeneti szöveg.

    Visszatérés:
        Csak A-Z0-9 karaktereket tartalmazó, nagybetűs alak.
    """
    return re.sub(r"[^A-Z0-9]", "", str(s or "").upper())


def _strip_neptun_pdf_glue(code: str) -> str:
    """
    Táblázatos PDF-ből összetapadt oszlopok levágása (pl. ...-00001INTELLIGENT).
    """
    c = _canonicalize_course_code(code)
    if not c:
        return c
    c = re.sub(
        r"(-\d{3,6})(?:INTELLIGENT|SZAKMAI|GYAKORLATI|GYAKORLAT|ELMELET|ELMÉLET|THEORY|PRACTICAL)$",
        r"\1",
        c,
        flags=re.I,
    )
    c = re.sub(r"^([A-Z]{2,12}\d{2,8}[A-Z]?)-GYAKORLATI$", r"\1", c, flags=re.I)
    c = re.sub(r"^([A-Z]{2,12}\d{2,8}[A-Z]?)-ELM[ÉE]LET$", r"\1", c, flags=re.I)
    m = re.match(r"^([A-Z]{2,12}\d{2,8}[A-Z0-9]{0,4})(-\d{3,6})([A-Z]{4,})$", c)
    if m and m.group(3).upper() not in ("E", "G", "TE", "PI"):
        return m.group(1) + m.group(2)
    return c


def _normalize_pdf_text(s: str) -> str:
    """
    PDF-ből kinyert szöveg előfeldolgozása kód- és névkinyerés előtt.

    Paraméterek:
        s: Nyers, extractor által visszaadott szöveg.

    Visszatérés:
        Unicode/szóköz/kötőjel szempontból normalizált szöveg, csökkentett sortörés-zajjal.
    """
    t = unicodedata.normalize("NFKC", str(s or ""))
    t = t.replace("\u00A0", " ")
    
    
    t = re.sub(r"(?<=[A-Za-z])\s*\n\s*(?=[A-Za-z0-9])", "", t)
    t = re.sub(r"(?<=\d)\s*\n\s*(?=\d)", "", t)
    
    t = re.sub(r"(?<=[_-])\s*\n\s*(?=\d)", "", t)
    t = t.replace("\u2013", "-").replace("\u2014", "-").replace("\u2212", "-")
    
    t = re.sub(r"\s*_\s*", "_", t)
    t = re.sub(r"\s*-\s*", "-", t)
    return t


def _is_plausible_course_code(code: str) -> bool:
    """
    Enyhe zajszűrés: kétbetűs + csak szám tokenek gyakran admin/azonosító zajok
    (pl. FI62198), ezért ezeket kizárjuk.
    """
    c = _canonicalize_course_code(code)
    if re.fullmatch(r"[A-Z]{2}\d{4,8}", c):
        return False
    return True


def _extract_codes_from_text_blob(text_blob: str) -> list[str]:
    """
    Lehetséges kurzuskódok kinyerése egy tetszőleges szövegrészből.

    Paraméterek:
        text_blob: PDF oldalból/sorból származó nyers szöveg.

    Visszatérés:
        Sorrendtartó, egyedi, kanonizált kurzuskódlista.
    """
    out: list[str] = []
    seen: set[str] = set()
    txt = _normalize_pdf_text(text_blob)
    for m in _COURSE_CODE_RE.finditer(txt):
        c = _canonicalize_course_code(m.group(1))
        if c and _is_plausible_course_code(c) and c not in seen:
            seen.add(c)
            out.append(c)
    
    for m in _SPLIT_SUFFIX_RE.finditer(txt):
        c = _canonicalize_course_code(f"{m.group(1)}{m.group(2)}")
        if c and _is_plausible_course_code(c) and c not in seen:
            seen.add(c)
            out.append(c)
    
    for m in _XSH_SPLIT_RE.finditer(txt):
        c = _canonicalize_course_code(f"{m.group(1)}_{m.group(2)}-{m.group(3)}")
        if c and _is_plausible_course_code(c) and c not in seen:
            seen.add(c)
            out.append(c)
    
    for m in _XSH_LOOSE_RE.finditer(txt):
        c = _canonicalize_course_code(f"{m.group(1)}_{m.group(2)}-{m.group(3)}")
        if c and _is_plausible_course_code(c) and c not in seen:
            seen.add(c)
            out.append(c)
    return out


def _pick_best_code_candidate(candidates: list[str]) -> str:
    """
    A jelöltek közül kiválasztja a legvalószínűbb kurzuskódot.

    Paraméterek:
        candidates: Kinyert, zajos kódjelöltek listája.

    Visszatérés:
        A legjobb kanonikus kód, vagy üres sztring.
    """
    if not candidates:
        return ""
    uniq = list(
        dict.fromkeys(_strip_neptun_pdf_glue(_canonicalize_course_code(c)) for c in candidates if c)
    )
    if not uniq:
        return ""
    eg = [c for c in uniq if c.endswith(("E", "G"))]
    if eg:
        return max(eg, key=len)
    return max(uniq, key=len)


def _pretty_code(canonical_code: str, raw_hint: str = "") -> str:
    """
    Megjelenítésre alkalmas, olvasható kódalak előállítása.

    Paraméterek:
        canonical_code: Belső, kanonikus kurzuskód.
        raw_hint: Opcionális nyers kódalak a PDF-ből.

    Visszatérés:
        UI/debug célra formázott, felhasználóbarát kód.
    """
    c = _canonicalize_course_code(canonical_code or "")
    rh = _normalize_pdf_text(raw_hint or "")
    rh = re.sub(r"\s+", "", rh)
    rh = re.sub(r"[^A-Za-z0-9_-]", "", rh)
    out = c
    if rh:
        rh_u = rh.upper()
        c_u = c.upper()
        if rh_u == c_u or rh_u.replace("-", "") == c_u.replace("-", ""):
            out = rh
    
    m_final = re.fullmatch(r"XSH_FINAL-(\d{3,6})", c.upper())
    if m_final:
        return f"XSH_Final{m_final.group(1)}"
    m_hun = re.fullmatch(r"XSH_HUNLANG-(\d{3,6})", c.upper())
    if m_hun:
        return f"XSH_HunLang-{m_hun.group(1)}"
    m_mmen = re.fullmatch(r"MMEN(\d+)PI([EG])", c.upper())
    if m_mmen:
        return f"MMEN{m_mmen.group(1)}pi{m_mmen.group(2)}"
    return out or c


def _guess_course_name_from_line(code: str, line: str) -> str:
    """
    Egy kódot tartalmazó sorból megpróbál tantárgynevet becsülni.

    Paraméterek:
        code: A sorból eltávolítandó kurzuskód.
        line: Nyers sor-szöveg.

    Visszatérés:
        Tisztított névszerű szöveg, vagy üres sztring.
    """
    s = str(line or "")
    if not s:
        return ""
    
    s = re.sub(re.escape(code), " ", s, flags=re.I)
    s = re.sub(r"\b\d{1,3}\b", " ", s)
    s = re.sub(r"[()\[\]{}]", " ", s)
    s = re.sub(r"\s+", " ", s).strip(" -\t")
    
    if len(s) < 3:
        return ""
    return s[:140]


def _looks_like_instructor_fragment(s: str) -> bool:
    """
    Heurisztika: oktató név/tömb felismerése a "tantárgy, oktató" közös cellából.
    PDF-ben a dőlt betű információ elvész, ezért szövegalapon közelítünk.
    """
    txt = re.sub(r"\s+", " ", str(s or "")).strip(" ,;")
    if not txt:
        return False
    lower = txt.lower()
    if re.search(r"\bdr\.?\b", lower):
        return True
    if re.search(r"\bprof\.?\b", lower):
        return True
    if re.search(r"\b(phd|habil)\b", lower):
        return True
    if re.search(r"\d", txt):
        return False
    
    parts = [p.strip() for p in txt.split(",") if p.strip()]
    if len(parts) >= 2 and all(len(p.split()) >= 2 for p in parts):
        return True
    
    tokens = [t for t in re.split(r"\s+", txt) if t]
    if 2 <= len(tokens) <= 5:
        capitalish = 0
        for t in tokens:
            if not re.search(r"[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]", t):
                continue
            if t[:1].isupper():
                capitalish += 1
        if capitalish >= max(2, len(tokens) - 1):
            return True
    return False


def _clean_subject_name_cell(raw_name: str) -> str:
    """
    A "Tantárgy megnevezése, oktatója" cellából csak a tantárgy megnevezést tartja meg.
    """
    raw = _normalize_pdf_text(str(raw_name or ""))
    if not raw:
        return ""
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in raw.split("\n")]
    lines = [ln for ln in lines if ln]
    if not lines:
        return ""

    kept: list[str] = []
    for ln in lines:
        
        if "," in ln:
            ln = ln.split(",", 1)[0].strip()
        if not ln:
            continue
        
        if _looks_like_instructor_fragment(ln):
            break
        kept.append(ln)

    if not kept:
        
        kept = [lines[0]]

    name = " ".join(kept)
    name = re.sub(r"\s+", " ", name).strip(" ,;")
    
    name = re.sub(r"(?<=[a-záéíóöőúüű])(?=[A-ZÁÉÍÓÖŐÚÜŰ])", " ", name)
    
    name = re.sub(r"embeddedmachine", "embedded machine", name, flags=re.I)
    name = re.sub(r"machinelearning", "machine learning", name, flags=re.I)
    name = re.sub(r"learningpractice", "learning practice", name, flags=re.I)
    name = re.sub(r"thesiswork", "thesis work", name, flags=re.I)
    name = re.sub(r"\bwork\s*(\d+\.?)\b", r"work \1", name, flags=re.I)
    name = re.sub(r"human-computerinterfaces", "human-computer interfaces", name, flags=re.I)
    name = re.sub(r"interfaceslab", "interfaces lab", name, flags=re.I)
    name = re.sub(r"szakmaigyakorlat", "Szakmai gyakorlat", name, flags=re.I)
    name = re.sub(r"t[őo]l\s*felvettek\s*r[eé]sz[eé]re", "től felvettek részére", name, flags=re.I)
    
    name = re.sub(r"\s*\(\s*", " (", name)
    name = re.sub(r"\s*\)\s*", ") ", name)
    
    name = re.sub(r"(?i)embedded machine learning", "Embedded machine learning", name)
    name = re.sub(r"(?i)intelligent human-computer interfaces", "Intelligent Human-Computer Interfaces", name)
    name = re.sub(r"(?i)thesis work", "Thesis Work", name)
    
    name = re.sub(
        r"\s+[A-ZÁÉÍÓÖŐÚÜŰ][A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]{2,}(?:[A-ZÁÉÍÓÖŐÚÜŰ][A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]{2,})+(?:Dr\.?|Prof\.?)?$",
        "",
        name,
    )
    name = re.sub(
        r"\s+[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]{2,}(?:\s+[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]{2,}){1,3}\s+(?:Dr\.?|Prof\.?)$",
        "",
        name,
    )
    name = re.sub(r"\s+", " ", name).strip(" ,;")
    if name:
        name = name[0].upper() + name[1:]
    return name[:180]


def _pick_better_subject_name(name_cell: str, requirement_cell: str) -> str:
    """
    A név oszlop és a requirement oszlop közül válassza a kevésbé zajos nevet.
    """
    n1 = _clean_subject_name_cell(name_cell)
    n2 = _clean_subject_name_cell(requirement_cell)
    if not n1:
        return n2
    if not n2:
        return n1
    
    if n1.count(" ") == 0 and n2.count(" ") >= 1:
        return n2
    if n2.count(" ") == 0 and n1.count(" ") >= 1:
        return n1
    
    return n1 if len(n1) <= len(n2) else n2


def _extract_code_candidates_from_code_cell(raw_code: str) -> list[str]:
    """
    A kódcella gyakran zajos (kód + tantárgynév darabok). Először szigorúan a vezető
    tokenből próbálunk kódot kinyerni, csak utána esünk vissza a teljes cellára.
    """
    txt = _normalize_pdf_text(str(raw_code or ""))
    if "," in txt:
        txt = txt.split(",", 1)[0]
    if not txt:
        return []
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in txt.split("\n")]
    lines = [ln for ln in lines if ln]
    candidates: list[str] = []

    def _take(blob: str):
        """Collects and appends extracted code candidates from a text fragment."""
        nonlocal candidates
        if not blob:
            return
        got = _extract_codes_from_text_blob(blob)
        if got:
            candidates.extend(got)

    
    if lines:
        first = lines[0]
        first_no_comma = first.split(",", 1)[0].strip()
        first_token = re.split(r"\s+", first_no_comma)[0] if first_no_comma else ""
        first_joined = first_no_comma
        if len(lines) >= 2 and first_no_comma.endswith(("-", "_")):
            
            second_no_comma = lines[1].split(",", 1)[0].strip()
            if second_no_comma:
                first_joined = f"{first_no_comma}{second_no_comma}"
        strict_first = _extract_codes_from_text_blob(first_token)
        if strict_first:
            return list(dict.fromkeys(strict_first))
        strict_joined = _extract_codes_from_text_blob(first_joined)
        if strict_joined:
            return list(dict.fromkeys(strict_joined))
        _take(first_joined)
        _take(first_no_comma)
        _take(first)
        if candidates:
            return list(dict.fromkeys(candidates))

    
    _take(txt)
    if candidates:
        return list(dict.fromkeys(candidates))

    
    compact_code = re.sub(r"[^A-Za-z0-9_-]", "", txt)
    _take(compact_code)
    return list(dict.fromkeys(candidates))


def _is_textual_name_like(value: str) -> bool:
    """
    Eldönti, hogy egy cellaérték név jellegű szövegnek tűnik-e.

    Paraméterek:
        value: Vizsgált cellaérték.

    Visszatérés:
        Igaz, ha emberi olvasásra alkalmas tárgynévnek látszik, különben hamis.
    """
    s = re.sub(r"\s+", " ", str(value or "")).strip()
    if len(s) < 3:
        return False
    if re.fullmatch(r"\d+", s):
        return False
    letters = re.findall(r"[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]", s)
    return len(letters) >= 3


def _infer_code_name_columns(rows: list[list[str]], fallback_code_idx: int, fallback_name_idx: int) -> tuple[int, int]:
    """
    PDF táblák oszlop-eltolását korrigálja.
    Tipikus eset: 0=sorszám, 1=tárgykód, 2=tárgynév.
    """
    if not rows:
        return fallback_code_idx, fallback_name_idx
    ncols = max((len(r) for r in rows), default=0)
    if ncols <= 1:
        return fallback_code_idx, fallback_name_idx

    code_hits = [0 for _ in range(ncols)]
    name_hits = [0 for _ in range(ncols)]
    sample = rows[:12]
    for row in sample:
        for i in range(ncols):
            cell = str(row[i] if i < len(row) else "")
            if _pick_best_code_candidate(_extract_code_candidates_from_code_cell(cell)):
                code_hits[i] += 1
            if _is_textual_name_like(cell):
                name_hits[i] += 1

    best_code_idx = max(range(ncols), key=lambda i: (code_hits[i], -i))
    
    if code_hits[best_code_idx] <= 0:
        return fallback_code_idx, fallback_name_idx

    
    right_candidates = [i for i in range(best_code_idx + 1, ncols)]
    if not right_candidates:
        return best_code_idx, fallback_name_idx
    best_name_idx = max(right_candidates, key=lambda i: (name_hits[i], -abs(i - (best_code_idx + 1))))
    return best_code_idx, best_name_idx


def _extract_code_name_pairs_from_tables(pdf_bytes: bytes) -> dict[str, str]:
    """
    Táblázat alapú kinyerés (pdfplumber), elsődlegesen a
    Subject code / Subject name oszlopokra.
    """
    out: dict[str, str] = {}
    if pdfplumber is None:
        return out
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for p in pdf.pages:
                tables = p.extract_tables() or []
                for tbl in tables:
                    if not tbl or len(tbl) < 2:
                        continue
                    header = [str(c or "").strip().lower() for c in (tbl[0] or [])]
                    code_idx = -1
                    name_idx = -1
                    has_header = False
                    if header:
                        for i, h in enumerate(header):
                            h2 = re.sub(r"\s+", " ", h)
                            h2n = unicodedata.normalize("NFKD", h2)
                            h2n = "".join(ch for ch in h2n if not unicodedata.combining(ch))
                            if code_idx < 0 and (
                                "subject code" in h2
                                or h2 == "code"
                                or "tárgykód" in h2
                                or "targykod" in h2n
                            ):
                                code_idx = i
                            if name_idx < 0 and (
                                "subject name" in h2
                                or h2 == "name"
                                or "tárgynév" in h2
                                or "tantárgy" in h2
                                or "targynev" in h2n
                                or "tantargy" in h2n
                            ):
                                name_idx = i
                        has_header = code_idx >= 0
                    
                    
                    if code_idx < 0:
                        code_idx = 1 if len(header) >= 2 else 0
                    if name_idx < 0:
                        name_idx = min(code_idx + 1, max(0, len(header) - 1)) if header else 1
                    rows_iter = tbl[1:] if has_header else tbl
                    code_idx, name_idx = _infer_code_name_columns(rows_iter, code_idx, name_idx)
                    for row in rows_iter:
                        if not row or code_idx >= len(row):
                            continue
                        raw_code = str(row[code_idx] or "")
                        code_candidates = _extract_code_candidates_from_code_cell(raw_code)
                        code = _pick_best_code_candidate(code_candidates)
                        if not code:
                            continue
                        name = ""
                        if 0 <= name_idx < len(row):
                            name = str(row[name_idx] or "")
                            name = _clean_subject_name_cell(name)
                        if code and name and code not in out:
                            out[code] = name
    except Exception:
        return out
    return out


def _extract_table_debug_rows(pdf_bytes: bytes) -> list[dict[str, Any]]:
    """
    Táblázatos PDF-részből sor-szintű debug adatokat gyűjt.

    Paraméterek:
        pdf_bytes: PDF bináris tartalma.

    Visszatérés:
        Feldolgozott sorok listája admin diagnosztikai célra.
    """
    rows_out: list[dict[str, Any]] = []
    if pdfplumber is None:
        return rows_out
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for p_idx, p in enumerate(pdf.pages, 1):
                tables = p.extract_tables() or []
                for tbl in tables:
                    if not tbl or len(tbl) < 1:
                        continue
                    header = [str(c or "").strip().lower() for c in (tbl[0] or [])]
                    code_idx, name_idx, req_idx, hours_idx, credit_idx, term_idx = 0, 1, 2, 3, 4, 6
                    has_header = False
                    if header:
                        for i, h in enumerate(header):
                            h2 = re.sub(r"\s+", " ", h)
                            h2n = unicodedata.normalize("NFKD", h2)
                            h2n = "".join(ch for ch in h2n if not unicodedata.combining(ch))
                            if (
                                "subject code" in h2
                                or h2 == "code"
                                or "tárgykód" in h2
                                or "targykod" in h2n
                            ):
                                code_idx = i
                                has_header = True
                            if (
                                "subject name" in h2
                                or h2 == "name"
                                or "tárgynév" in h2
                                or "tantárgy" in h2
                                or "targynev" in h2n
                                or "tantargy" in h2n
                            ):
                                name_idx = i
                            if "requirement" in h2:
                                req_idx = i
                            if "class hours" in h2:
                                hours_idx = i
                            if h2 == "credit":
                                credit_idx = i
                            if "term" in h2:
                                term_idx = i
                    if not has_header:
                        
                        if len(header) >= 2:
                            code_idx = 1
                        if len(header) >= 3:
                            name_idx = 2
                    rows_iter = tbl[1:] if has_header else tbl
                    code_idx, name_idx = _infer_code_name_columns(rows_iter, code_idx, name_idx)
                    for row in rows_iter:
                        if not row:
                            continue
                        raw_code = str(row[code_idx] or "") if code_idx < len(row) else ""
                        code_candidates = _extract_code_candidates_from_code_cell(raw_code)
                        code = _pick_best_code_candidate(code_candidates)
                        name_raw = str(row[name_idx] or "") if name_idx < len(row) else ""
                        requirement = str(row[req_idx] or "") if req_idx < len(row) else ""
                        class_hours = str(row[hours_idx] or "") if hours_idx < len(row) else ""
                        credit_raw = str(row[credit_idx] or "") if credit_idx < len(row) else ""
                        term_raw = str(row[term_idx] or "") if term_idx < len(row) else ""
                        name = _pick_better_subject_name(name_raw, requirement)
                        requirement = re.sub(r"\s+", " ", requirement).strip()
                        class_hours = re.sub(r"\s+", " ", class_hours).strip()
                        credit_raw = re.sub(r"\s+", " ", credit_raw).strip()
                        term_raw = re.sub(r"\s+", " ", term_raw).strip()
                        is_w_hours = bool(re.match(r"^W:\s*\d+/\d+/\d+$", class_hours, re.I))
                        credit_val = None
                        semester_val = None
                        m_credit = re.search(r"\d+", credit_raw)
                        if m_credit:
                            try:
                                credit_val = int(m_credit.group(0))
                            except Exception:
                                credit_val = None
                        m_term = re.search(r"/(\d+)$", term_raw)
                        if m_term:
                            try:
                                semester_val = int(m_term.group(1))
                            except Exception:
                                semester_val = None
                        if not code and not name:
                            continue
                        rows_out.append(
                            {
                                "page": p_idx,
                                "code": code,
                                "code_display": _pretty_code(code, raw_code),
                                "code_raw": _normalize_pdf_text(raw_code),
                                "name": name,
                                "requirement": requirement,
                                "class_hours": class_hours,
                                "credit": credit_val,
                                "term_raw": term_raw,
                                "semester": semester_val,
                                "is_w_hours": is_w_hours,
                            }
                        )
    except Exception:
        return rows_out
    return rows_out


def _extract_pdf_code_name_guesses(pdf_bytes: bytes) -> dict[str, str]:
    """
    Kód->név becslési térkép összeállítása a PDF táblákból.

    Paraméterek:
        pdf_bytes: PDF bináris tartalma.

    Visszatérés:
        Szótár, ahol a kulcs kanonikus kurzuskód, az érték a becsült tantárgynév.
    """
    return _extract_code_name_pairs_from_tables(pdf_bytes)


def _extract_course_codes_from_pdf_bytes(
    pdf_bytes: bytes,
    *,
    known_codes_with_compact: list[tuple[str, str]] | None = None,
) -> list[str]:
    """
    Kurzuskódok kinyerése PDF-ből szöveges és táblás heurisztikák kombinálásával.

    Paraméterek:
        pdf_bytes: PDF bináris tartalma.
        known_codes_with_compact: Opcionális ismert (kanonikus, tömör) kódpárok fallback egyezéshez.

    Visszatérés:
        Tisztított, egyedi, kanonikus kurzuskódlista.
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    found: list[str] = []
    seen: set[str] = set()
    for page in reader.pages:
        txt = page.extract_text() or ""
        
        for code in _extract_codes_from_text_blob(txt):
            if code in seen:
                continue
            seen.add(code)
            found.append(code)
        
        
        if known_codes_with_compact:
            compact_page = _compact_code(txt)
            for db_code, db_compact in known_codes_with_compact:
                if db_compact and db_compact in compact_page and db_code not in seen:
                    seen.add(db_code)
                    found.append(db_code)
    
    if pdfplumber is not None:
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for p in pdf.pages:
                    words = p.extract_words() or []
                    if words:
                        lines: dict[int, list[tuple[float, str]]] = defaultdict(list)
                        for w in words:
                            top = int(round(float(w.get("top", 0.0))))
                            x0 = float(w.get("x0", 0.0))
                            lines[top].append((x0, str(w.get("text", ""))))
                        for _, ws in sorted(lines.items(), key=lambda kv: kv[0]):
                            ws_sorted = [x[1] for x in sorted(ws, key=lambda x: x[0])]
                            line_txt = " ".join(ws_sorted)
                            for code in _extract_codes_from_text_blob(line_txt):
                                if code not in seen:
                                    seen.add(code)
                                    found.append(code)
                    
                    ptxt = p.extract_text() or ""
                    for code in _extract_codes_from_text_blob(ptxt):
                        if code not in seen:
                            seen.add(code)
                            found.append(code)
        except Exception:
            
            pass
    return _cleanup_extracted_codes(found)


def _cleanup_extracted_codes(codes: list[str]) -> list[str]:
    """
    Kiszűri a csonka kódokat, ha megtalálható a teljes E/G végű pár.
    Példa: MMEN101PI + MMEN101PIG -> MMEN101PI törlése.
    """
    cleaned: list[str] = []
    seen_c: set[str] = set()
    for c in codes:
        cc = _strip_neptun_pdf_glue(_canonicalize_course_code(c))
        if cc and cc not in seen_c:
            seen_c.add(cc)
            cleaned.append(cc)
    uniq = cleaned
    s = set(uniq)
    out: list[str] = []
    for c in uniq:
        if c.endswith(("E", "G")):
            out.append(c)
            continue
        has_full_pair = any((c + suf) in s for suf in ("E", "G"))
        if has_full_pair:
            continue
        
        if re.fullmatch(r"[A-Z]{2,12}\d{2,8}[A-Z0-9]{0,4}", c):
            if any(x.startswith(c + "-") for x in uniq):
                continue
        out.append(c)
    return out


def _infer_person_key_from_filename(filename: str) -> str:
    """
    Normalizált személy-kulcsot képez a fájlnév tokenjeiből.

    Paraméterek:
        filename: Feltöltött fájl eredeti neve.

    Visszatérés:
        Stabil, normalizált személyazonosító kulcs a fájlok csoportosításához.
    """
    base = re.sub(r"\.[^.]+$", "", str(filename or "").strip(), flags=re.I)
    norm = _normalize_text_for_match(base)
    for hint in _PERSON_STRIP_HINTS:
        h = _normalize_text_for_match(hint)
        norm = norm.replace(h, " ")
    norm = re.sub(r"[_\-]+", " ", norm)
    norm = re.sub(r"\s+", " ", norm).strip()
    parts = [p for p in norm.split() if p]
    
    if len(parts) >= 2:
        norm = " ".join(sorted(parts))
    return norm or "__unknown__"


def _infer_document_kind_from_filename(filename: str) -> str:
    """
    Felismerés a fájlnévből (a person_key számítás előtt, eredeti szövegből).
    """
    base = re.sub(r"\.[^.]+$", "", str(filename or "").strip(), flags=re.I)
    norm = _normalize_text_for_match(base)
    if "teljesit" in norm or "completed" in norm:
        return "completed_credits"
    if "felvett" in norm or "enrolled" in norm:
        return "enrolled_credits"
    return "unknown"


def _finalize_document_kind(kinds: set[str]) -> tuple[str, list[str]]:
    """
    Végleges dokumentumtípus meghatározása a fájlonként felismert típusokból.

    Paraméterek:
        kinds: Felismert típuscímkék halmaza.

    Visszatérés:
        (vegso_tipus, rendezett_tipuslista) tuple.
    """
    uniq = sorted(k for k in kinds if k)
    if not uniq:
        return "unknown", ["unknown"]
    non_u = [k for k in uniq if k != "unknown"]
    if not non_u:
        return "unknown", uniq
    if len(non_u) == 1:
        return non_u[0], uniq
    return "mixed", uniq


def _parse_date_guess_to_iso(s: str) -> str | None:
    """
    Laza dátumalak ISO-formátumú dátummá konvertálása.

    Paraméterek:
        s: Dátumszerű szöveg (pl. yyyy.mm.dd vagy dd/mm/yyyy).

    Visszatérés:
        ISO dátum (YYYY-MM-DD), vagy None ha nem értelmezhető.
    """
    t = str(s or "").strip()
    if not t:
        return None
    parts = re.split(r"[./-]", t)
    if len(parts) != 3:
        return None
    try:
        if len(parts[0]) == 4:
            y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
        else:
            d, m, y = int(parts[0]), int(parts[1]), int(parts[2])
        return date(y, m, d).isoformat()
    except Exception:
        return None


def _extract_birth_dates_from_pdf_bytes(pdf_bytes: bytes) -> set[str]:
    """
    Címkézett születési dátumok kinyerése és normalizálása PDF-ből.

    Paraméterek:
        pdf_bytes: PDF bináris tartalma.

    Visszatérés:
        A dokumentumban talált, ISO-formátumra alakított születési dátumok halmaza.
    """
    texts: list[str] = []
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            texts.append(page.extract_text() or "")
    except Exception:
        pass
    if pdfplumber is not None:
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for p in pdf.pages:
                    texts.append(p.extract_text() or "")
        except Exception:
            pass
    out: set[str] = set()
    for txt in texts:
        norm = _normalize_pdf_text(txt)
        for m in _DOB_LABELED_RE.finditer(norm):
            iso = _parse_date_guess_to_iso(m.group(2))
            if iso:
                out.add(iso)
    return out


def _credit_missing_rules_only(requirements_rows: list[dict]) -> list[dict]:
    """
    PDF szimuláció admin listájában csak kredites hiányok jelenjenek meg.
    (hours/count blokkok külön logikát követnek, ne torzítsák a kredites hiánylistát.)
    """
    out: list[dict[str, Any]] = []
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


def _summary_credit_only(requirements_payload: dict | None) -> dict[str, Any]:
    """
    Kártyás "missing_total" számolás: csak kredites hiányok.
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


class ProgressPdfSimulationService:
    def __init__(self, db: Session):
        """
        PDF szimulációs szolgáltatás inicializálása.

        Paraméterek:
            db: Aktív SQLAlchemy adatbázis session.
        """
        self.db = db

    def _user_name_index(self) -> dict[str, list[dict[str, Any]]]:
        """
        Normalizált névindex építése felhasználó-párosításhoz.

        Visszatérés:
            Szótár: normalizált személy-kulcs -> lehetséges felhasználói rekordok.
        """
        rows = self.db.execute(
            text(
                """
                SELECT u.id, u.name, u.mothers_name, u.major, u.chosen_specialization_code, u.birth_date, m.id AS major_id
                FROM users u
                LEFT JOIN majors m ON m.name = u.major
                """
            )
        ).fetchall()
        out: dict[str, list[dict[str, Any]]] = {}
        for r in rows:
            raw = _normalize_text_for_match(r.name or "")
            if not raw:
                continue
            parts = [p for p in raw.split() if p]
            k = " ".join(sorted(parts)) if len(parts) >= 2 else raw
            out.setdefault(k, []).append({
                "id": int(r.id),
                "name": str(r.name or ""),
                "mothers_name": str(getattr(r, "mothers_name", None) or ""),
                "major": str(r.major or ""),
                "major_id": (int(r.major_id) if getattr(r, "major_id", None) is not None else None),
                "chosen_specialization_code": r.chosen_specialization_code,
                "birth_date": (r.birth_date.isoformat() if getattr(r, "birth_date", None) else None),
            })
        return out

    def _course_code_lookup(
        self,
        codes: list[str],
        *,
        lang: str = "hu",
    ) -> tuple[dict[str, int], dict[str, str], list[str]]:
        """
        Kinyert kódok feloldása ismert adatbázis-kurzusokra.

        Paraméterek:
            codes: Kinyert kanonikus kódok listája.
            lang: Kimeneti név nyelve ("hu" vagy "en").

        Visszatérés:
            Tuple: (kód->course_id, kód->megjelenő_név, hiányzó_kódok).
        """
        if not codes:
            return {}, {}, []
        uniq = list(dict.fromkeys(codes))
        
        
        rows = (
            self.db.query(models.Course.id, models.Course.course_code, models.Course.name, models.Course.name_en)
            .all()
        )
        by_upper: dict[str, Any] = {}
        by_compact: dict[str, Any] = {}
        for r in rows:
            u = str(r.course_code or "").strip().upper()
            if not u:
                continue
            by_upper[u] = r
            comp = _compact_code(u)
            if comp not in by_compact:
                by_compact[comp] = r

        def _row_name(r: Any) -> str:
            """Nyelvhelyes kurzusnév kiválasztása egy DB sorból."""
            if lang == "en" and getattr(r, "name_en", None):
                return str(r.name_en)
            return str(r.name or r.name_en or "")

        id_map: dict[str, int] = {}
        name_map: dict[str, str] = {}
        for c in uniq:
            cu = _canonicalize_course_code(c)
            r = by_upper.get(cu) or by_compact.get(_compact_code(cu))
            if r is not None:
                id_map[c] = int(r.id)
                name_map[c] = _row_name(r)
        missing = [c for c in uniq if c not in id_map]
        return id_map, name_map, missing

    @staticmethod
    def _near_matches_for_missing(
        missing_codes: list[str],
        known_codes: list[tuple[str, str]],
    ) -> dict[str, list[str]]:
        """
        Közeli kódjavaslatok készítése nem feloldott kódokhoz.

        Paraméterek:
            missing_codes: Ismert kurzushoz nem illesztett kódok.
            known_codes: Ismert (kanonikus, tömör) kódpárok listája.

        Visszatérés:
            Szótár: hiányzó_kód -> hasonló ismert kódok listája.
        """
        known_plain = [kc for kc, _ in known_codes]
        out: dict[str, list[str]] = {}
        for miss in missing_codes:
            m = _canonicalize_course_code(miss)
            mc = _compact_code(m)
            base = re.sub(r"[EG]$", "", m)
            basec = _compact_code(base)
            candidates: list[str] = []
            for kc in known_plain:
                kcc = _compact_code(kc)
                if kc.startswith(base) or base.startswith(re.sub(r"[EG]$", "", kc)):
                    candidates.append(kc)
                    continue
                if basec and (kcc.startswith(basec) or basec.startswith(kcc)):
                    candidates.append(kc)
                    continue
                if len(mc) >= 6 and len(kcc) >= 6 and mc[:6] == kcc[:6]:
                    candidates.append(kc)
            if candidates:
                out[miss] = sorted(list(dict.fromkeys(candidates)))[:6]
        return out

    @staticmethod
    def _debug_code_report(
        all_codes: list[str],
        code_to_id: dict[str, int],
        code_to_pdf_name: dict[str, str],
        code_to_db_name: dict[str, str],
        code_to_display: dict[str, str],
        table_debug_rows: list[dict[str, Any]],
        known_codes: list[tuple[str, str]],
    ) -> dict[str, Any]:
        """
        Összesített debug payload összeállítása kódkinyerés és illesztés ellenőrzéséhez.

        Paraméterek:
            all_codes: Végleges, kinyert kanonikus kódlista.
            code_to_id: Feloldott kód->course_id megfeleltetés.
            code_to_pdf_name: PDF-ből becsült nevek kódonként.
            code_to_db_name: Adatbázisban található kurzusnevek kódonként.
            code_to_display: Megjelenítésre formázott kódtérkép.
            table_debug_rows: Parse-olt táblasorok diagnosztikához.
            known_codes: Ismert adatbázis-kódok tömör reprezentációval.

        Visszatérés:
            Admin debug nézet által használt, részletes diagnosztikai szótár.
        """
        present_codes = [c for c in all_codes if c in code_to_id]
        missing_codes = [c for c in all_codes if c not in code_to_id]
        present_rows = [
            {
                "code": code_to_display.get(c, c),
                "name": code_to_db_name.get(c, "") or code_to_pdf_name.get(c, ""),
                "db_name": code_to_db_name.get(c, ""),
                "pdf_name": code_to_pdf_name.get(c, ""),
                "name_mismatch": (
                    bool(code_to_pdf_name.get(c, ""))
                    and bool(code_to_db_name.get(c, ""))
                    and _normalize_course_name_for_compare(code_to_pdf_name.get(c, ""))
                    != _normalize_course_name_for_compare(code_to_db_name.get(c, ""))
                ),
                "course_id": code_to_id.get(c),
                "in_db": True,
            }
            for c in present_codes[:200]
        ]
        missing_rows = [
            {
                "code": code_to_display.get(c, c),
                "name": code_to_pdf_name.get(c, ""),
                "course_id": None,
                "in_db": False,
            }
            for c in missing_codes[:200]
        ]
        return {
            "extracted_codes": [code_to_display.get(c, c) for c in all_codes[:200]],
            "present_in_db_codes": present_codes[:200],
            "missing_in_db_codes": missing_codes[:200],
            "present_in_db_rows": present_rows,
            "missing_in_db_rows": missing_rows,
            "present_in_db_count": len(present_codes),
            "missing_in_db_count": len(missing_codes),
            "present_name_mismatch_count": sum(1 for r in present_rows if r.get("name_mismatch")),
            "table_rows_count": len(table_debug_rows),
            "table_w_rows_count": sum(1 for r in table_debug_rows if r.get("is_w_hours")),
            "table_debug_rows": table_debug_rows[:500],
            "near_matches_for_missing": ProgressPdfSimulationService._near_matches_for_missing(
                missing_codes[:200], known_codes
            ),
        }

    def _all_known_course_codes(self) -> list[tuple[str, str]]:
        """
        Ismert kurzuskódok betöltése kanonikus és tömörített alakban.

        Visszatérés:
            (kanonikus_kód, tömörített_kód) tuple listája.
        """
        rows = self.db.query(models.Course.course_code).all()
        out: list[tuple[str, str]] = []
        for r in rows:
            code = _canonicalize_course_code(str(r.course_code or ""))
            if not code:
                continue
            out.append((code, _compact_code(code)))
        return out

    def simulate(self, files: list[tuple[str, bytes]], *, lang: str = "hu") -> dict[str, Any]:
        """
        Teljes PDF szimuláció futtatása több fájlon.

        Paraméterek:
            files: (fájlnév, PDF bytes) párok listája.
            lang: Kimeneti nyelv ("hu" vagy "en").

        Visszatérés:
            Személyenként csoportosított szimulációs eredmény, illesztési és debug adatokkal.
        """
        known_codes_with_compact = self._all_known_course_codes()
        groups: dict[str, dict[str, Any]] = defaultdict(lambda: {"files": [], "codes": []})
        for filename, payload in files:
            person_key = _infer_person_key_from_filename(filename)
            dk = _infer_document_kind_from_filename(filename)
            birth_dates = _extract_birth_dates_from_pdf_bytes(payload)
            table_debug_rows = _extract_table_debug_rows(payload)
            table_codes = [str(r.get("code") or "").strip() for r in table_debug_rows if str(r.get("code") or "").strip()]
            
            
            if table_codes:
                codes = _cleanup_extracted_codes(table_codes)
            else:
                codes = _extract_course_codes_from_pdf_bytes(
                    payload,
                    known_codes_with_compact=known_codes_with_compact,
                )
            code_name_guesses = _extract_pdf_code_name_guesses(payload)
            for c in code_name_guesses.keys():
                if c not in codes:
                    codes.append(c)
            groups[person_key]["files"].append(filename)
            groups[person_key].setdefault("document_kinds", set()).add(dk)
            groups[person_key]["codes"].extend(codes)
            groups[person_key].setdefault("birth_dates", set()).update(birth_dates)
            groups[person_key].setdefault("table_debug_rows", []).extend(table_debug_rows)
            existing_names = groups[person_key].setdefault("pdf_name_guesses", {})
            for c, n in code_name_guesses.items():
                if c not in existing_names and n:
                    existing_names[c] = n

        user_idx = self._user_name_index()
        out_people: list[dict[str, Any]] = []
        for person_key, g in groups.items():
            doc_kind, doc_kinds_list = _finalize_document_kind(set(g.get("document_kinds") or set()))
            all_codes = _cleanup_extracted_codes(list(dict.fromkeys(g["codes"])))
            code_to_id, code_to_db_name, missing_codes = self._course_code_lookup(all_codes, lang=lang)
            code_to_pdf_name = dict(g.get("pdf_name_guesses") or {})
            table_debug_rows = list(g.get("table_debug_rows") or [])
            code_to_display: dict[str, str] = {}
            for r in table_debug_rows:
                cc = _canonicalize_course_code(str(r.get("code") or ""))
                if not cc:
                    continue
                cd = str(r.get("code_display") or "").strip()
                if cd and cc not in code_to_display:
                    code_to_display[cc] = cd
            for c in all_codes:
                if c not in code_to_display:
                    code_to_display[c] = _pretty_code(c, "")
            missing_codes_pretty = [code_to_display.get(c, c) for c in missing_codes[:100]]
            birth_dates = set(g.get("birth_dates") or set())
            user_candidates = list(user_idx.get(person_key) or [])
            matched_user = None
            if user_candidates:
                if len(user_candidates) == 1:
                    matched_user = user_candidates[0]
                elif birth_dates:
                    by_dob = [u for u in user_candidates if (u.get("birth_date") in birth_dates)]
                    if len(by_dob) == 1:
                        matched_user = by_dob[0]
            if not matched_user:
                dbg = self._debug_code_report(
                    all_codes,
                    code_to_id,
                    code_to_pdf_name,
                    code_to_db_name,
                    code_to_display,
                    table_debug_rows,
                    known_codes_with_compact,
                )
                out_people.append(
                    {
                        "person_key": person_key,
                        "document_kind": doc_kind,
                        "document_kinds": doc_kinds_list,
                        "matched_user": None,
                        "files": g["files"],
                        "extracted_codes_count": len(all_codes),
                        "known_course_codes_count": len(code_to_id),
                        "missing_course_codes": missing_codes_pretty,
                        "debug": dbg,
                        "birth_dates_found": sorted(list(birth_dates)),
                        "name_match_candidates": [
                            {
                                "id": int(u["id"]),
                                "name": u["name"],
                                "mothers_name": u.get("mothers_name"),
                                "birth_date": u.get("birth_date"),
                            }
                            for u in user_candidates
                        ],
                        "status": "user_not_matched",
                    }
                )
                continue

            uid = int(matched_user["id"])
            base_completed_rows = self.db.execute(
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
            hypothetical_completed = set(base_completed)
            hypothetical_completed.update(code_to_id.values())

            before = get_user_requirements(uid, lang, self.db)
            after = get_user_requirements_with_completed_courses(uid, lang, self.db, hypothetical_completed)
            after_rows = after.get("requirements") or []
            missing_rows = _credit_missing_rules_only(after_rows)

            out_people.append(
                {
                    "person_key": person_key,
                    "document_kind": doc_kind,
                    "document_kinds": doc_kinds_list,
                    "matched_user": {
                        "id": uid,
                        "name": matched_user["name"],
                        "mothers_name": matched_user.get("mothers_name"),
                        "major": matched_user["major"],
                        "major_id": matched_user.get("major_id"),
                        "chosen_specialization_code": matched_user.get("chosen_specialization_code"),
                        "birth_date": matched_user.get("birth_date"),
                    },
                    "files": g["files"],
                    "extracted_codes_count": len(all_codes),
                    "known_course_codes_count": len(code_to_id),
                    "missing_course_codes": missing_codes_pretty,
                    "debug": self._debug_code_report(
                        all_codes,
                        code_to_id,
                        code_to_pdf_name,
                        code_to_db_name,
                        code_to_display,
                        table_debug_rows,
                        known_codes_with_compact,
                    ),
                    "baseline_summary": _summary_credit_only(before),
                    "hypothetical_summary": _summary_credit_only(after),
                    "diploma_ready_hypothetical": len(missing_rows) == 0,
                    "missing_rules_hypothetical": missing_rows[:80],
                    "birth_dates_found": sorted(list(birth_dates)),
                    "status": "ok",
                }
            )

        return {
            "ok": True,
            "people": out_people,
            "note": "PDF adatok csak memóriafeldolgozásban lettek használva; adatbázisba nem írtunk.",
        }

