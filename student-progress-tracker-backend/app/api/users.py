import os
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.db import models, schemas
from app.db.database import get_db
from app.services.users_service import UsersService
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from mailjet_rest import Client
from app.utils import create_access_token, verify_access_token, get_current_user, admin_required
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
        "TextPart": f"Kérjük, erősítsd meg a regisztrációdat: http://enaploproject.ddns.net/verify.html?token={verify_token}",
        "HTMLPart": f"<h3>Kérjük, erősítsd meg a regisztrációdat:</h3><a href='http://enaploproject.ddns.net/verify.html?token={verify_token}'>Kattints ide a megerősítéshez</a>"
        }
      ]
    }
    result = mailjet.send.create(data=data)
    return result.status_code, result.json()



@router.get("/verify")
def verify_user(token: str, db: Session = Depends(get_db)):
    """
    Felhasználó verifikációja e-mailben kapott token alapján.

    Args:
        token (str): A verifikációs token az URL-ből.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        dict: Siker vagy hibaüzenet.
    """
    user = db.query(models.User).filter(models.User.verify_token == token).first()
    if not user:
        return {"detail": "Érvénytelen vagy lejárt token!"}
    user.verified = True
    user.verify_token = None
    db.commit()
    return {"detail": "Sikeres e-mail hitelesítés! Most már bejelentkezhetsz az oldalra."}

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
        HTTPException: Ha a felhasználó létrehozása vagy az e-mail küldés nem sikerül.
    """
    users_service = UsersService(db)
    try:
        db_user = users_service.create_user(user)
        status, resp = send_verification_email(db_user.email, db_user.verify_token)
        if status != 200:
            raise Exception(f"E-mail küldési hiba: {resp}")
        return db_user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{user_id}", response_model=schemas.User, dependencies=[Depends(admin_required)])
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Felhasználó adatainak lekérése az ID alapján. (Csak admin)

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

@router.put("/{user_id}", response_model=schemas.User, dependencies=[Depends(admin_required)])
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(get_db)):
    """
    Felhasználó adatainak frissítése. (Csak admin)

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

@router.delete("/{user_id}", response_model=dict, dependencies=[Depends(admin_required)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Felhasználó törlése az ID alapján. (Csak admin)

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

@router.get("/", response_model=List[schemas.User], dependencies=[Depends(admin_required)])
def list_users(db: Session = Depends(get_db)):
    """
    Az összes felhasználó lekérdezése. (Csak admin)

    Args:
        db (Session): Az adatbázis kapcsolat.

    Returns:
        List[schemas.User]: Az összes felhasználó listája.
    """
    users_service = UsersService(db)
    return users_service.list_users()

@router.post("/login")
def login_user(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Felhasználó bejelentkeztetése e-mail vagy NEPTUN kód és jelszó alapján.

    Args:
        login_data (schemas.UserLogin): A bejelentkezési adatok.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        dict: Sikeres bejelentkezés esetén access_token és token_type.

    Raises:
        HTTPException: Hibás adatok vagy nem verifikált fiók esetén.
    """
    users_service = UsersService(db)
    try:
        user = users_service.login_user(login_data)
        access_token = create_access_token({"user_id": user.id, "role": user.role})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))