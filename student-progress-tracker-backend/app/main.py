from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, courses, progress, users, forgot_password, reset_password

app = FastAPI()
print("### FASTAPI ELINDULT ###")
# CORS konfiguráció
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routerek regisztrálása Basic Auth nélkül
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(forgot_password.router, prefix="/api/users", tags=["users"])
app.include_router(reset_password.router, prefix="/api/users", tags=["users"])

@app.get("/")
def read_root():
    """
    Gyökér végpont, amely elérhető hitelesítés nélkül is.
    """
    return {"message": "Welcome to the Hallgatói Előrehaladás-követő Webes Alkalmazás API!"}