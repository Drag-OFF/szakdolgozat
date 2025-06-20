from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db import models, schemas
from app.db.database import get_db
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/register/", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Felhasználó regisztrálása.

    Args:
        user (schemas.UserCreate): A regisztráló felhasználó adatai.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.User: A létrehozott felhasználó.

    Raises:
        HTTPException: Ha a regisztráció nem sikerült.
    """
    auth_service = AuthService(db)
    try:
        return auth_service.register(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login/", response_model=schemas.Token)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Felhasználó bejelentkezése.

    Args:
        user (schemas.UserLogin): A bejelentkező felhasználó adatai.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.Token: A bejelentkezett felhasználó tokenje.

    Raises:
        HTTPException: Ha a bejelentkezés nem sikerült.
    """
    auth_service = AuthService(db)
    try:
        return auth_service.login(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))