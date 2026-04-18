"""
SQLAlchemy motor, session és induláskori séma-ellenőrzés (régi ``major_requirement_rules`` táblák).
"""
from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import DATABASE_URL

Base = declarative_base()

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_major_requirement_rules_schema() -> None:
    """
    Ha a tábla létezik, de régi dumpból hiányoznak oszlopok, hozzáadja őket (MySQL).
    """
    from sqlalchemy import inspect

    insp = inspect(engine)
    if not insp.has_table("major_requirement_rules"):
        return

    existing = {c["name"] for c in insp.get_columns("major_requirement_rules")}
    alters: list[str] = []
    if "parent_rule_code" not in existing:
        alters.append(
            "ALTER TABLE major_requirement_rules "
            "ADD COLUMN parent_rule_code VARCHAR(80) NULL"
        )
    if "is_specialization_root" not in existing:
        alters.append(
            "ALTER TABLE major_requirement_rules "
            "ADD COLUMN is_specialization_root TINYINT(1) NOT NULL DEFAULT 0"
        )
    if "value_type" not in existing:
        alters.append(
            "ALTER TABLE major_requirement_rules "
            "ADD COLUMN value_type VARCHAR(20) NOT NULL DEFAULT 'credits'"
        )
    if "min_value" not in existing:
        alters.append(
            "ALTER TABLE major_requirement_rules "
            "ADD COLUMN min_value INT NOT NULL DEFAULT 0"
        )
    if "include_in_total" not in existing:
        alters.append(
            "ALTER TABLE major_requirement_rules "
            "ADD COLUMN include_in_total TINYINT(1) NOT NULL DEFAULT 1"
        )
    if not alters:
        return

    with engine.begin() as conn:
        for stmt in alters:
            conn.execute(text(stmt))
