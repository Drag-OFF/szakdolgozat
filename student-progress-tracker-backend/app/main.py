"""
FastAPI alkalmazás belépési pontja: CORS, opcionális probe-szűrő middleware, API routerek.

Induláskor meghívódik az adatbázis séma-ellenőrzés (``major_requirement_rules`` hiányzó oszlopai).

**CORS:** JWT ``Authorization`` fejlécet használunk, nem sütit; ezért ``allow_credentials=False``.
Ha ``allow_credentials=True`` és ``allow_origins=["*"]`` lenne, egyes böngészők preflight hibát okoznának.

**Middleware sorrend:** a ``ProbeBlockMiddleware`` utoljára kerül regisztrálásra, így a Starlette láncban
elsőként fut, és gyors 404-et ad ismert zajos pathokra (lásd ``probe_block``).
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import block_http_probes, cors_allow_origins
from app.middleware.probe_block import ProbeBlockMiddleware
from app.db.database import ensure_major_requirement_rules_schema
from app.api import chat, courses, progress, users, forgot_password, reset_password
from app.api import course_major, course_equivalence, majors, course_recommendations, major_requirement_rules
from app.api import admin_tanterv
from app.api import admin_progress_pdf_check

ensure_major_requirement_rules_schema()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)
if block_http_probes():
    app.add_middleware(ProbeBlockMiddleware)

app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(forgot_password.router, prefix="/api/users", tags=["users"])
app.include_router(reset_password.router, prefix="/api/users", tags=["users"])
app.include_router(course_major.router, prefix="/api/course_major", tags=["course_major"])
app.include_router(course_equivalence.router, prefix="/api/course_equivalence", tags=["course_equivalence"])
app.include_router(majors.router, prefix="/api/majors", tags=["majors"])
app.include_router(major_requirement_rules.router, prefix="/api/major_requirement_rules", tags=["major_requirement_rules"])
app.include_router(course_recommendations.router, prefix="/api/course_recommendations", tags=["course_recommendations"])
app.include_router(admin_tanterv.router, prefix="/api/admin", tags=["admin"])
app.include_router(admin_progress_pdf_check.router, prefix="/api/admin", tags=["admin"])

@app.get("/")
def read_root():
    """
    Gyökér végpont, amely elérhető hitelesítés nélkül is.
    """
    return {"message": "Welcome to the Hallgatói Előrehaladás-követő Webes Alkalmazás API!"}
