"""
Környezeti változók betöltése: a repó gyökerében lévő `.env` (szakdolgozat/.env).
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# app/config.py → app → student-progress-tracker-backend → repó gyökér
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

# Mailjet — üres = e-mail küldés nem megy (fejlesztéshez oké)
MAILJET_API_KEY = _get_str("MAILJET_API_KEY", "")
MAILJET_API_SECRET = _get_str("MAILJET_API_SECRET", "")

# Linkek a verifikációs / jelszó-reset e-mailekben
PUBLIC_SITE_URL = _get_str("PUBLIC_SITE_URL", "http://localhost").rstrip("/")

MAIL_FROM_EMAIL = _get_str("MAIL_FROM_EMAIL", "enaploproject@gmail.com")
MAIL_FROM_NAME = _get_str("MAIL_FROM_NAME", "Enaplo Project")


def cors_allow_origins() -> list[str]:
    raw = (os.getenv("CORS_ORIGINS") or "*").strip()
    if raw == "*":
        return ["*"]
    return [o.strip() for o in raw.split(",") if o.strip()]
