# Backend — FastAPI (hallgatói előrehaladás-követő)

> **Teljes projektdokumentáció** (cél, funkciók, biztonság, skálázás, tesztelési javaslatok):  
> **[../README.md](../README.md)** — a monorepo gyökerében.

---

## Rövid összefoglaló

- **Framework:** FastAPI + Uvicorn  
- **Adatbázis:** MySQL (SQLAlchemy, `DATABASE_URL`)  
- **Auth:** JWT Bearer token, `admin` / `user` szerepkör  
- **API lista:** futó szerveren **http://127.0.0.1:8000/docs**

## `.env` helye

A `app/config.py` a **repó gyökerében** (a `student-progress-tracker-backend` **szülő mappájában**) tölti a `.env` fájlt. Példa változók: a gyökér **README.md** „Konfiguráció” szakasza és `app/config.py`.

## Telepítés és futtatás

```bash
cd student-progress-tracker-backend
python -m venv .venv
# Windows: .\.venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Routerek (belépési pont)

`app/main.py`: chat, courses, progress, users (forgot/reset password), course_major, course_equivalence, majors, major_requirement_rules, course_recommendations, admin (tanterv, PDF ellenőrzés).

## Tesztek

Automatikus tesztkészlet a repóban nem garantált — javasolt pytest + HTTP `TestClient`; részletek a gyökér **README.md** „Tesztelés” szakaszában.
