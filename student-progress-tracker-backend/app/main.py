from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import cors_allow_origins
from app.api import chat, courses, progress, users, forgot_password, reset_password
from app.api import course_major, course_equivalence, majors, course_recommendations, major_requirement_rules

app = FastAPI()
# CORS konfiguráció
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins(),
    # JWT Authorization headerrel dolgozunk, nem cookie-val; True + allow_origins=["*"]
    # böngészőnként elhasalhat (preflight / Failed to fetch).
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Routerek regisztrálása Basic Auth nélkül
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

@app.get("/")
def read_root():
    """
    Gyökér végpont, amely elérhető hitelesítés nélkül is.
    """
    return {"message": "Welcome to the Hallgatói Előrehaladás-követő Webes Alkalmazás API!"}
