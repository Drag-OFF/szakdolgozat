"""
Neptun mintatanterv HTML kibontása (``tanterv.aspx``).

**Folyamat**
    1. ``GET`` a tanterv oldalra a ``kod`` paraméterrel.
    2. Ha van „Összes nyit” űrlap: egy ``POST`` a fa tömeges kinyitásához (ViewState-tel).
    3. BFS a maradék „+” gombok ``NyitZar`` értékein: minden lépés új HTML-t ad, a soron következő
       plusz formok indexe frissül (szekvenciális, nem párhuzamosítható).

**Konfiguráció:** ``NEPTUN_INTER_POST_DELAY_MS``, ``NEPTUN_MAX_BFS_STEPS`` — lásd ``app.config``.

**Biztonság:** csak ``https://oktweb.neptun.u-szeged.hu`` és ``/tanterv/`` alatti URL-ek engedélyezettek.

A lokális HTML import (0 Neptun POST) a ``neptun_tanterv_import_service`` rétegben van; ez a modul a távoli bontást végzi.
"""

from __future__ import annotations

import re
import time
import unicodedata
from collections import deque
from typing import Any
from urllib.parse import urldefrag, urljoin, urlparse

import httpx

from app.config import neptun_inter_post_delay_ms, neptun_max_bfs_steps_cap

BASE_HOST = "https://oktweb.neptun.u-szeged.hu"
TANTERV_PATH = "/tanterv/tanterv.aspx"
_ALLOWED_NETLOC = urlparse(BASE_HOST).netloc
_TANTERV_PATH_PREFIX = "/tanterv/"

_KOD_RE = re.compile(r"^[A-Za-z0-9_\-]{3,40}$")
_RE_INVALID_TANTERV = re.compile(
    r"Nincs\s+ilyen\s+kódú\s+tanterv\s*:?\s*([^\s<]+)?",
    re.I,
)
_FORM_RE = re.compile(r"<form\s+([^>]*)>(.*?)</form>", re.I | re.S)


def _raise_if_unknown_tanterv_code(html: str, kod_clean: str) -> None:
    if "nincs ilyen kódú tanterv" not in html.lower():
        return
    m = _RE_INVALID_TANTERV.search(html)
    shown = ((m.group(1) or "").strip() if m else "") or kod_clean
    raise ValueError(
        f"A Neptun nem ismeri ezt a mintatanterv kódot: {shown}. "
        "Ellenőrizd a pontos kódot (pl. BSZKPTI-N1)."
    )


def _assert_https_tanterv_tree_url(resolved: str, *, ctx: str) -> str:
    """Minden Neptun HTTP kérés: csak https, oktweb host, /tanterv/ alatti útvonal."""
    u, _frag = urldefrag((resolved or "").strip())
    p = urlparse(u)
    if (p.scheme or "").lower() != "https":
        raise ValueError(f"{ctx}: csak https engedélyezett.")
    host = (p.netloc or "").split("@")[-1].split(":")[0].lower()
    if host != _ALLOWED_NETLOC.lower():
        raise ValueError(f"{ctx}: csak {_ALLOWED_NETLOC} engedélyezett.")
    path = (p.path or "").replace("\\", "/").lower()
    if not path.startswith(_TANTERV_PATH_PREFIX):
        raise ValueError(f"{ctx}: csak a /tanterv/ alkalmazás alatti URL használható.")
    return u


def _sanitize_kod(kod: str) -> str:
    s = str(kod or "").strip()
    if not _KOD_RE.fullmatch(s):
        raise ValueError("A 'kod' paraméter formátuma nem megengedett.")
    return s


def _resolve_action(action: str) -> str:
    if not action:
        resolved = urljoin(BASE_HOST, TANTERV_PATH)
        return _assert_https_tanterv_tree_url(resolved, ctx="Tanterv alap URL")
    a = str(action or "").strip()
    if not a.lower().startswith(("http://", "https://")) and not a.startswith("/"):
        resolved = urljoin(urljoin(BASE_HOST + "/", TANTERV_PATH.lstrip("/")), a)
    else:
        resolved = urljoin(BASE_HOST + "/", a.lstrip("/"))
    path = (urlparse(resolved).path or "").replace("\\", "/")
    if path.lower().endswith("tanterv.aspx") and not path.lower().endswith("/tanterv/tanterv.aspx"):
        resolved = urljoin(BASE_HOST, TANTERV_PATH)
    return _assert_https_tanterv_tree_url(resolved, ctx="Űrlap action")


def _form_inner_has_plus_submit(form_inner: str) -> bool:
    for m in re.finditer(r"<input\s+([^>]+)>", form_inner, flags=re.I):
        attrs = m.group(1)
        if not re.search(r"type\s*=\s*[\"']?submit", attrs, flags=re.I):
            continue
        if re.search(r"value\s*=\s*(?:\"|')?\+(?:\"|')?", attrs, flags=re.I):
            return True
    return False


def _form_inner_has_open_all_submit(form_inner: str) -> bool:
    """Alján lévő „Összes nyit” gomb: type=submit, name=Nyit, value tartalmazza az összes nyit szöveget."""
    for m in re.finditer(r"<input\s+([^>]+)>", form_inner, flags=re.I | re.S):
        attrs = m.group(1)
        if not re.search(r"type\s*=\s*[\"']?submit", attrs, flags=re.I):
            continue
        name_m = re.search(
            r'\bname\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s"\'=]+))',
            attrs,
            flags=re.I,
        )
        name = (name_m.group(1) or name_m.group(2) or name_m.group(3) or "").strip() if name_m else ""
        if name.lower() != "nyit":
            continue
        val_m = re.search(
            r'\bvalue\s*=\s*(?:\"([^\"]*)\"|\'([^\']*)\'|([^\s>]+))',
            attrs,
            flags=re.I,
        )
        raw = ""
        if val_m:
            raw = (
                val_m.group(1)
                if val_m.group(1) is not None
                else (val_m.group(2) if val_m.group(2) is not None else (val_m.group(3) or ""))
            )
        norm = unicodedata.normalize("NFKD", (raw or "").lower())
        norm = "".join(c for c in norm if not unicodedata.combining(c))
        if "osszes" in norm and "nyit" in norm:
            return True
    return False


def _filter_open_all_post_data(fields: dict[str, str], form_inner: str) -> dict[str, str]:
    """
    Csak a „Összes nyit” (Nyit) submit menjen — a „Zár” submitot ne (a böngésző sem küldi el mindkettőt).
    """
    out = dict(fields)
    for m in re.finditer(r"<input\s+([^>]+)>", form_inner, flags=re.I | re.S):
        attrs = m.group(1)
        if not re.search(r"type\s*=\s*[\"']?submit", attrs, flags=re.I):
            continue
        name_m = re.search(
            r'\bname\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s"\'=]+))',
            attrs,
            flags=re.I,
        )
        name = (name_m.group(1) or name_m.group(2) or name_m.group(3) or "").strip() if name_m else ""
        if not name:
            continue
        val_m = re.search(
            r'\bvalue\s*=\s*(?:\"([^\"]*)\"|\'([^\']*)\'|([^\s>]+))',
            attrs,
            flags=re.I,
        )
        raw = ""
        if val_m:
            raw = (
                val_m.group(1)
                if val_m.group(1) is not None
                else (val_m.group(2) if val_m.group(2) is not None else (val_m.group(3) or ""))
            )
        norm = unicodedata.normalize("NFKD", (raw or "").lower())
        norm = "".join(c for c in norm if not unicodedata.combining(c))
        if name.lower() == "nyit" and "osszes" in norm and "nyit" in norm:
            continue
        out.pop(name, None)
    return out


def _find_open_all_form(html: str) -> dict[str, Any] | None:
    """Első <form>, amelyben van „Összes nyit” submit — action + mezők (ViewState stb.)."""
    for fm in _FORM_RE.finditer(html):
        head, inner = fm.group(1), fm.group(2)
        if not _form_inner_has_open_all_submit(inner):
            continue
        act_m = re.search(r"action\s*=\s*([\"'])(.*?)\1", head, flags=re.I | re.S)
        action = act_m.group(2) if act_m else ""
        fields = _parse_input_fields(inner)
        return {"action": action, "fields": dict(fields), "inner": inner}
    return None


def _parse_input_fields(form_inner: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for m in re.finditer(r"<input\s+([^>]+)>", form_inner, flags=re.I | re.S):
        attrs = m.group(1)
        name_m = re.search(
            r'\bname\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s"\'=]+))',
            attrs,
            flags=re.I,
        )
        if not name_m:
            continue
        name = name_m.group(1) or name_m.group(2) or name_m.group(3) or ""
        if not name:
            continue
        val_m = re.search(
            r"\bvalue\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))",
            attrs,
            flags=re.I,
        )
        if val_m:
            value = (
                val_m.group(1)
                if val_m.group(1) is not None
                else (val_m.group(2) if val_m.group(2) is not None else (val_m.group(3) or ""))
            )
        else:
            value = ""
        fields[name] = value
    return fields


def _norm_ascii_text(s: str) -> str:
    n = unicodedata.normalize("NFKD", (s or "").lower())
    n = "".join(c for c in n if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", n).strip()


def _iter_submit_inputs(form_inner: str) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for m in re.finditer(r"<input\s+([^>]+)>", form_inner, flags=re.I | re.S):
        attrs = m.group(1)
        if not re.search(r"type\s*=\s*[\"']?submit", attrs, flags=re.I):
            continue
        name_m = re.search(
            r'\bname\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s"\'=]+))',
            attrs,
            flags=re.I,
        )
        name = (name_m.group(1) or name_m.group(2) or name_m.group(3) or "").strip() if name_m else ""
        val_m = re.search(
            r'\bvalue\s*=\s*(?:\"([^\"]*)\"|\'([^\']*)\'|([^\s>]+))',
            attrs,
            flags=re.I,
        )
        value = ""
        if val_m:
            value = (
                val_m.group(1)
                if val_m.group(1) is not None
                else (val_m.group(2) if val_m.group(2) is not None else (val_m.group(3) or ""))
            )
        out.append({"name": name, "value": value})
    return out


def _expand_plus_forms_index(html: str) -> tuple[dict[str, dict[str, Any]], int]:
    """
    Egy HTML-bejárás: NyitZar kulcs → + form (első előfordulás nyer).
    Vissza: (index, hány + form egyezett — a régi len(lista) számlálóval kompatibilis).
    """
    out: dict[str, dict[str, Any]] = {}
    n_matched = 0
    for fm in _FORM_RE.finditer(html):
        head, inner = fm.group(1), fm.group(2)
        if not _form_inner_has_plus_submit(inner):
            continue
        act_m = re.search(r"action\s*=\s*([\"'])(.*?)\1", head, flags=re.I | re.S)
        action = act_m.group(2) if act_m else ""
        fields = _parse_input_fields(inner)
        nz = fields.get("NyitZar") or fields.get("nyitZar")
        if not nz or not str(nz).isdigit():
            continue
        n_matched += 1
        key = str(nz)
        if key in out:
            continue
        out[key] = {"nyit_zar": key, "action": action, "fields": fields}
    return out, n_matched


def _bfs_expand_html(kod_clean: str, max_steps: int) -> tuple[str, dict[str, Any]]:
    env_cap = neptun_max_bfs_steps_cap()
    requested_steps = max_steps
    if env_cap is not None:
        max_steps = min(max_steps, env_cap)

    start_url = urljoin(BASE_HOST, TANTERV_PATH)
    params = {"kod": kod_clean}
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; TantervExpandBot/1.0; +student-progress-tracker)",
        "Accept-Language": "hu-HU,hu;q=0.9,en;q=0.8",
    }
    visited: set[str] = set()
    errors: list[str] = []

    t_expand0 = time.perf_counter()

    post_delay_ms = neptun_inter_post_delay_ms()
    bulk_open_all_used = False
    bulk_open_all_seconds: float | None = None
    steps = 0

    with httpx.Client(
        timeout=httpx.Timeout(120.0, connect=15.0),
        follow_redirects=True,
        headers=headers,
        limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
    ) as client:
        r0 = client.get(start_url, params=params)
        r0.raise_for_status()
        html = r0.text
        _raise_if_unknown_tanterv_code(html, kod_clean)

        oa = _find_open_all_form(html)
        if oa:
            t_bulk = time.perf_counter()
            try:
                action_url = _resolve_action(oa["action"])
                data = _filter_open_all_post_data(oa["fields"], oa["inner"])
                if "kod" not in action_url.lower():
                    rb = client.post(action_url, params=params, data=data)
                else:
                    rb = client.post(action_url, data=data)
                rb.raise_for_status()
                html = rb.text
                bulk_open_all_used = True
                bulk_open_all_seconds = round(time.perf_counter() - t_bulk, 2)
                if post_delay_ms > 0:
                    time.sleep(post_delay_ms / 1000.0)
            except Exception as e:
                errors.append(f"Összes nyit POST sikertelen (BFS folytatódik): {e}")

        forms_idx, initial_plus_forms = _expand_plus_forms_index(html)
        queue: deque[str] = deque()
        in_queue: set[str] = set()
        for q in forms_idx:
            if q not in visited and q not in in_queue:
                queue.append(q)
                in_queue.add(q)

        while queue and steps < max_steps:
            nz = queue.popleft()
            in_queue.discard(nz)
            if nz in visited:
                continue
            form = forms_idx.get(nz)
            if not form:
                errors.append(f"NyitZar={nz}: nincs + form az aktuális HTML-ben.")
                visited.add(nz)
                continue

            action_url = _resolve_action(form["action"])

            data = form["fields"]
            if "kod" not in action_url.lower():
                resp = client.post(action_url, params=params, data=data)
            else:
                resp = client.post(action_url, data=data)
            resp.raise_for_status()
            html = resp.text
            visited.add(nz)
            steps += 1

            forms_idx, _n = _expand_plus_forms_index(html)
            for q2 in forms_idx:
                if q2 not in visited and q2 not in in_queue:
                    queue.append(q2)
                    in_queue.add(q2)

            if post_delay_ms > 0:
                time.sleep(post_delay_ms / 1000.0)

    elapsed_s = time.perf_counter() - t_expand0
    bulk_s = float(bulk_open_all_seconds or 0.0)
    bfs_wall_s = max(0.0, elapsed_s - bulk_s)
    meta: dict[str, Any] = {
        "kod": kod_clean,
        "max_steps_requested": requested_steps,
        "max_steps_effective": max_steps,
        "neptun_env_step_cap": env_cap,
        "bulk_open_all_used": bulk_open_all_used,
        "bulk_open_all_seconds": bulk_open_all_seconds,
        "initial_plus_forms": initial_plus_forms,
        "steps": steps,
        "visited_count": len(visited),
        "queue_remaining": len(queue),
        "stopped_by_max_steps": steps >= max_steps and bool(queue),
        "final_html_length": len(html),
        "errors": errors,
        "expand_elapsed_seconds": round(elapsed_s, 2),
        "avg_seconds_per_step": round(bfs_wall_s / steps, 4) if steps else None,
        "inter_post_delay_ms": post_delay_ms,
    }
    return html, meta


def expand_all_plus_nodes(
    kod: str,
    *,
    max_steps: int = 1500,
    preview_chars: int = 24_000,
) -> dict[str, Any]:
    """Előnézethez: kibontás + rövid HTML előnézet a válaszban (``html_preview``)."""
    kod_clean = _sanitize_kod(kod)
    html, meta = _bfs_expand_html(kod_clean, max_steps)
    meta["html_preview"] = html[:preview_chars]
    return meta


def get_expanded_tanterv_html(kod: str, *, max_steps: int = 5000) -> tuple[str, dict[str, Any]]:
    """Import pipeline-hoz: teljes HTML + meta (lépésszám, hibák, időzítés)."""
    kod_clean = _sanitize_kod(kod)
    return _bfs_expand_html(kod_clean, max_steps)
