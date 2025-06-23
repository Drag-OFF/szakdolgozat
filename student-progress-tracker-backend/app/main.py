from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
import secrets
from app.api import chat, courses, progress, users

# HTTP Basic Auth security objektum
security = HTTPBasic()

def basic_auth(credentials: HTTPBasicCredentials = Depends(security)):
    """
    Egyszerű HTTP Basic Auth ellenőrzés.
    Csak akkor engedélyezi a hozzáférést, ha a felhasználónév és jelszó helyes.

    Args:
        credentials (HTTPBasicCredentials): A kérésben kapott hitelesítési adatok.

    Raises:
        HTTPException: Ha a felhasználónév vagy jelszó hibás.
    """
    correct_username = secrets.compare_digest(credentials.username, "admin")
    correct_password = secrets.compare_digest(credentials.password, "jelszo123")
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hibás felhasználónév vagy jelszó",
            headers={"WWW-Authenticate": "Basic"},
        )

app = FastAPI()

# CORS konfiguráció
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routerek regisztrálása Basic Auth védelemmel
app.include_router(chat.router, prefix="/api", tags=["chat"], dependencies=[Depends(basic_auth)])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"], dependencies=[Depends(basic_auth)])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"], dependencies=[Depends(basic_auth)])
app.include_router(users.router, prefix="/api/users", tags=["users"], dependencies=[Depends(basic_auth)])

@app.get("/", dependencies=[Depends(basic_auth)])
def read_root():
    """
    Gyökér végpont, amely csak hitelesítés után érhető el.
    """
    return {"message": "Welcome to the Hallgatói Előrehaladás-követő Webes Alkalmazás API!"}