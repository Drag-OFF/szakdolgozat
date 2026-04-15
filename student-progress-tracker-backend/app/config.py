"""
Környezeti változók betöltése és alkalmazás-szintű konstansok.

A ``.env`` fájl helye: a **repó gyökere** (``student-progress-tracker-backend`` szülőmappája), mert
``Path(__file__).parent.parent.parent`` a ``app`` → ``backend`` → gyökér útvonalat adja.

**E-mail (Mailjet):** ha ``MAILJET_API_KEY`` / ``MAILJET_API_SECRET`` üres, a küldés kihagyódik (fejlesztéshez megfelelő).

**Publikus URL:** ``PUBLIC_SITE_URL`` a verifikációs és jelszó-visszaállító linkek alapja az e-mailekben.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_REPO_ROOT / ".env")


def _get_str(key: str, default: str) -> str:
    v = os.getenv(key)
    return v if v is not None and v.strip() != "" else default


DATABASE_URL = _get_str(
    "DATABASE_URL",
    "mysql+pymysql://root:@localhost/database",
)

JWT_SECRET_KEY = _get_str("JWT_SECRET_KEY", "nagyon-titkos-jelszo")

MAILJET_API_KEY = _get_str("MAILJET_API_KEY", "")
MAILJET_API_SECRET = _get_str("MAILJET_API_SECRET", "")

PUBLIC_SITE_URL = _get_str("PUBLIC_SITE_URL", "http://localhost").rstrip("/")

MAIL_FROM_EMAIL = _get_str("MAIL_FROM_EMAIL", "enaploproject@gmail.com")
MAIL_FROM_NAME = _get_str("MAIL_FROM_NAME", "Enaplo Project")


def block_http_probes() -> bool:
    """
    Ismert szkenner pathok (/_next, POST /api, POST /) korai 404-e.
    Kikapcsolás: BLOCK_HTTP_PROBES=false
    """
    raw = (os.getenv("BLOCK_HTTP_PROBES") or "true").strip().lower()
    return raw not in ("0", "false", "no", "off", "")


def cors_allow_origins() -> list[str]:
    raw = (os.getenv("CORS_ORIGINS") or "*").strip()
    if raw == "*":
        return ["*"]
    return [o.strip() for o in raw.split(",") if o.strip()]


def neptun_max_bfs_steps_cap() -> int | None:
    """
    Neptun tanterv BFS: max. hány POST-lépés (NyitZar) futhat egy futásban.
    Ha a változó nincs beállítva: alap 2 (rate-limit védelem).
    Teljes import: NEPTUN_MAX_BFS_STEPS=4000 vagy off (nincs plafon).
    Üres érték (.env-ben NEPTUN_MAX_BFS_STEPS=) = nincs plafon.
    none / off / -1 / 0 = nincs plafon.
    """
    raw = os.getenv("NEPTUN_MAX_BFS_STEPS")
    if raw is None:
        raw = "2"
    else:
        raw = raw.strip()
    if raw == "" or raw.lower() in ("none", "off", "-1"):
        return None
    try:
        n = int(raw)
    except ValueError:
        return 2
    if n <= 0:
        return None
    return n


def neptun_inter_post_delay_ms() -> int:
    """
    Minden sikeres Neptun „+” POST után ennyi ms várakozás (rate limit / throttling).
    0 = nincs késleltetés. Max. 5000 ms (biztonsági plafon).
    """
    raw = (os.getenv("NEPTUN_INTER_POST_DELAY_MS") or "").strip()
    if not raw:
        return 0
    try:
        n = int(raw)
    except ValueError:
        return 0
    return max(0, min(n, 5000))
