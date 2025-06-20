from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db import models, schemas
from app.db.database import get_db
from app.services.users_service import UsersService
from typing import List

router = APIRouter()

@router.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Felhasználó létrehozása.

    Args:
        user (schemas.UserCreate): A létrehozandó felhasználó adatai.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.User: A létrehozott felhasználó.

    Raises:
        HTTPException: Ha a felhasználó létrehozása nem sikerül.
    """
    users_service = UsersService(db)
    try:
        return users_service.create_user(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Felhasználó adatainak lekérése az ID alapján.

    Args:
        user_id (int): A lekérdezendő felhasználó azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.User: A lekérdezett felhasználó.

    Raises:
        HTTPException: Ha a felhasználó nem található.
    """
    users_service = UsersService(db)
    user = users_service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(get_db)):
    """
    Felhasználó adatainak frissítése.

    Args:
        user_id (int): A frissítendő felhasználó azonosítója.
        user (schemas.UserUpdate): A frissítendő felhasználó új adatai.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.User: A frissített felhasználó.

    Raises:
        HTTPException: Ha a felhasználó nem található vagy a frissítés nem sikerül.
    """
    users_service = UsersService(db)
    updated_user = users_service.update_user(user_id, user)
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.delete("/users/{user_id}", response_model=dict)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Felhasználó törlése az ID alapján.

    Args:
        user_id (int): A törlendő felhasználó azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        dict: A törlés sikerességéről szóló üzenet.

    Raises:
        HTTPException: Ha a felhasználó nem található.
    """
    users_service = UsersService(db)
    success = users_service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted successfully"}

@router.get("/", response_model=List[schemas.User])
def list_users(db: Session = Depends(get_db)):
    """
    Az összes felhasználó lekérdezése.

    Args:
        db (Session): Az adatbázis kapcsolat.

    Returns:
        List[schemas.User]: Az összes felhasználó listája.
    """
    users_service = UsersService(db)
    return users_service.list_users()
