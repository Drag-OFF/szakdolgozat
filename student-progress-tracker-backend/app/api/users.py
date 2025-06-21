import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db import models, schemas
from app.db.database import get_db
from app.services.users_service import UsersService
from typing import List
from mailjet_rest import Client
import uuid

router = APIRouter()

def send_verification_email(to_email: str, verify_token: str):
    """
    Verifikációs e-mail küldése a felhasználónak Mailjet segítségével.

    Args:
        to_email (str): A címzett e-mail címe.
        verify_token (str): A verifikációs token.

    Returns:
        tuple: (status_code, válasz_json)
    """
    api_key = os.getenv("MAILJET_API_KEY", "8500664c47d6156ee0ba18594fdd88c6")
    api_secret = os.getenv("MAILJET_API_SECRET", "c9327b1703b7e2eb1ab59ebea33cad27")
    mailjet = Client(auth=(api_key, api_secret), version='v3.1')
    data = {
      'Messages': [
        {
          "From": {
            "Email": "enaploproject@gmail.com",
            "Name": "Enaplo Project"
          },
          "To": [
            {
              "Email": to_email,
              "Name": to_email
            }
          ],
          "Subject": "E-mail verifikáció",
          "TextPart": f"Kérjük, erősítsd meg a regisztrációdat: https://enaploproject.ddns.net/verify?token={verify_token}",
          "HTMLPart": f"<h3>Kérjük, erősítsd meg a regisztrációdat:</h3><a href='https://enaploproject.ddns.net/verify?token={verify_token}'>Kattints ide a megerősítéshez</a>"
        }
      ]
    }
    result = mailjet.send.create(data=data)
    return result.status_code, result.json()

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Felhasználó létrehozása és verifikációs e-mail küldése.

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
        if db.query(models.User).filter(
            (models.User.email == user.email) | (models.User.uid == user.uid)
        ).first():
            raise Exception("A felhasználó már létezik ezzel az e-mail címmel vagy NEPTUN kóddal.")

        verify_token = str(uuid.uuid4())

        db_user = models.User(**user.dict(), verify_token=verify_token, verified=False)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        status, resp = send_verification_email(db_user.email, verify_token)
        if status != 200:
            raise Exception(f"E-mail küldési hiba: {resp}")

        return db_user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{user_id}", response_model=schemas.User)
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

@router.put("/{user_id}", response_model=schemas.User)
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

@router.delete("/{user_id}", response_model=dict)
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
