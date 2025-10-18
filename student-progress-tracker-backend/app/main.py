from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, courses, progress, users, forgot_password, reset_password
from app.api import course_major, course_equivalence, majors, majors_requirements

app = FastAPI()
# CORS konfiguráció
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
app.include_router(majors_requirements.router, prefix="/api/majors_requirements", tags=["majors_requirements"])

@app.get("/")
def read_root():
    """
    Gyökér végpont, amely elérhető hitelesítés nélkül is.
    """
    return {"message": "Welcome to the Hallgatói Előrehaladás-követő Webes Alkalmazás API!"}