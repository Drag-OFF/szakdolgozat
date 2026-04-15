"""
Felhasználó API: regisztráció, bejelentkezés, profil, e-mail verifikáció, jelszó, admin műveletek, fiók törlés.
"""

import uuid
from typing import List, Tuple
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from mailjet_rest import Client

from app.db import models, schemas
from app.db.database import get_db
from app.db.schemas import EmailRequest
from app.config import (
    MAILJET_API_KEY,
    MAILJET_API_SECRET,
    PUBLIC_SITE_URL,
    MAIL_FROM_EMAIL,
    MAIL_FROM_NAME,
)
from app.services.users_service import UsersService
from app.utils.utils import create_access_token, admin_required, get_current_user
from app.utils.utils import verify_password, hash_password
from app.services.requirements_service import validate_chosen_specialization_for_major_name

router = APIRouter()


def send_verification_email(to_email: str, verify_token: str) -> Tuple[int, dict]:
    """
    Verifikációs e-mail küldése Mailjet segítségével.

    Paraméterek:
        to_email: A címzett e-mail címe.
        verify_token: A verifikációs token, amely a linkben szerepel.

    Visszatérés:
        tuple: (HTTP státuszkód, Mailjet válasz JSON)
    """
    if not MAILJET_API_KEY or not MAILJET_API_SECRET:
        raise HTTPException(
            status_code=503,
            detail="E-mail küldés nincs konfigurálva. Állítsd be a MAILJET_API_KEY és MAILJET_API_SECRET értékeket a .env-ben.",
        )
    mailjet = Client(auth=(MAILJET_API_KEY, MAILJET_API_SECRET), version="v3.1")
    verify_url = f"{PUBLIC_SITE_URL}/verify.html?token={verify_token}"
    data = {
        "Messages": [
            {
                "From": {"Email": MAIL_FROM_EMAIL, "Name": MAIL_FROM_NAME},
                "To": [{"Email": to_email, "Name": to_email}],
                "Subject": "E-mail verifikáció",
                "TextPart": f"Kérjük, erősítsd meg a regisztrációdat: {verify_url}",
                "HTMLPart": f"<h3>Kérjük, erősítsd meg a regisztrációdat:</h3>"
                            f"<a href='{verify_url}'>Kattints ide a megerősítéshez.</a>"
            }
        ]
    }
    result = mailjet.send.create(data=data)
    return result.status_code, result.json()


@router.post("/resend-verification", summary="Verifikációs e-mail újraküldése", description="Egy még nem verifikált felhasználóhoz új verifikációs e-mail küldése.")
def resend_verification(data: EmailRequest, db: Session = Depends(get_db)):
    """
    Új verifikációs e-mail küldése egy megadott e-mail címre,
    ha a felhasználó létezik és még nincs verifikálva.
    """
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Nincs ilyen felhasználó.")
    if user.verified:
        raise HTTPException(status_code=400, detail="A fiók már verifikálva van.")
    if not user.verify_token:
        raise HTTPException(status_code=400, detail="Ehhez a fiókhoz már nem lehet újra verifikációs e-mailt küldeni.")
    send_verification_email(user.email, user.verify_token)
    return {"detail": "A verifikációs e-mailt újra elküldtük."}


@router.get("/verify", summary="E-mail verifikáció", description="E-mailben kapott tokennel történő fiókverifikáció.")
def verify_user(token: str, db: Session = Depends(get_db)):
    """
    E-mailben kapott token alapján hitelesíti a felhasználói fiókot.
    """
    user = db.query(models.User).filter(models.User.verify_token == token).first()
    if not user:
        return {"detail": "Érvénytelen vagy lejárt token!"}
    user.verified = True
    user.verify_token = None
    db.commit()
    return {"detail": "Sikeres e-mail hitelesítés! Most már bejelentkezhetsz az oldalra."}


@router.post("", response_model=schemas.User, summary="Felhasználó létrehozása", description="Új felhasználó létrehozása és verifikációs e-mail küldése.")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Új felhasználó létrehozása. Sikeres regisztráció után verifikációs e-mail küldése.
    Publikus végpont (nem igényel bejelentkezést).
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


@router.get("/chat-users", response_model=List[schemas.ChatUser], summary="Chat felhasználók listája", description="Könnyített felhasználói lista chathez (védett végpont).")
def get_chat_users(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    Visszaadja a chat használatához szükséges, könnyített felhasználói adatokat.
    Csak bejelentkezett felhasználók érhetik el.
    """
    users = db.query(models.User).all()
    return [
        schemas.ChatUser(id=u.id, name=u.name, neptun=u.uid, role=u.role)
        for u in users
    ]


@router.get("/me", response_model=schemas.User, summary="Saját profil lekérése", description="Bejelentkezett felhasználó saját profiljának lekérése.")
def get_me(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user_id = current_user.get("user_id") or current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Érvénytelen token.")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch(
    "/me/specialization",
    response_model=schemas.User,
    summary="Saját MK specializáció",
    description="Jelölt specializációs ág (rule code) vagy NONE; üres body = szűrés kikapcsolva.",
)
def patch_my_specialization(
    body: schemas.SpecializationChoiceBody,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Érvénytelen token.")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Felhasználó nem található.")
    try:
        normalized = validate_chosen_specialization_for_major_name(user.major, body.code, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    user.chosen_specialization_code = normalized
    db.commit()
    db.refresh(user)
    return user


@router.get("/chat-leaderboard", response_model=List[schemas.ChatLeaderboardUser], summary="Chat ranglista", description="Dinamikus pontszám ranglista a teljesített kurzusok alapján.")
def get_chat_leaderboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    Visszaadja a chat jobb oldali ranglistát.
    A pontszám a `progress.points` mező összege, csak completed státuszú kurzusokra.
    """
    rows = db.execute(text("""
        SELECT
            u.id AS id,
            u.name AS name,
            u.uid AS neptun,
            COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.points ELSE 0 END), 0) AS points
        FROM users u
        LEFT JOIN progress p ON p.user_id = u.id
        GROUP BY u.id, u.name, u.uid
        ORDER BY points DESC, u.name ASC
    """)).fetchall()

    return [
        schemas.ChatLeaderboardUser(
            id=int(r.id),
            name=r.name,
            neptun=r.neptun,
            points=int(r.points or 0),
        )
        for r in rows
    ]


@router.get("/{user_id}", response_model=schemas.User, summary="Felhasználó lekérése", description="Felhasználói adat lekérése azonosító alapján (admin jogosultság szükséges).")
def get_user(user_id: int, db: Session = Depends(get_db), admin=Depends(admin_required)):
    """
    Az adott ID-jú felhasználó teljes profiljának lekérése.
    Csak admin jogosultsággal rendelkező felhasználók hívhatják.
    """
    users_service = UsersService(db)
    user = users_service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=schemas.User, summary="Felhasználó frissítése", description="Felhasználó adatainak módosítása (admin csak).")
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(get_db), admin=Depends(admin_required)):
    """
    Frissíti a megadott felhasználó adatait.
    Csak admin jogosultsággal hívható.
    """
    users_service = UsersService(db)
    try:
        updated_user = users_service.update_user(user_id, user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user


@router.delete("/{user_id}", response_model=dict, summary="Felhasználó törlése", description="Felhasználó törlése az ID alapján (admin csak).")
def delete_user(user_id: int, db: Session = Depends(get_db), admin=Depends(admin_required)):
    """
    Törli a megadott azonosítójú felhasználót.
    Csak admin jogosultsággal hívható.
    """
    users_service = UsersService(db)
    success = users_service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted successfully"}


@router.get("", response_model=List[schemas.User], summary="Felhasználók listázása", description="Az összes felhasználó lekérdezése (admin csak).")
def list_users(db: Session = Depends(get_db), admin=Depends(admin_required)):
    """
    Visszaadja az összes felhasználót az adatbázisból.
    Csak admin jogosultsággal érhető el.
    """
    users_service = UsersService(db)
    return users_service.list_users()


@router.post("/login", summary="Bejelentkezés", description="Bejelentkezés e-mail/NEPTUN + jelszó párossal. Visszaadja az access token-t és a felhasználói profilt.")
def login_user(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Hitelesíti a felhasználót és access token-t ad vissza sikeres belépés esetén.
    Nem igényel admin jogosultságot.
    """
    users_service = UsersService(db)
    try:
        user = users_service.login_user(login_data)
        if not getattr(user, "verified", True):
            raise HTTPException(status_code=401, detail="Kérjük, előbb erősítsd meg az e-mail címedet a belépéshez!")
        access_token = create_access_token({"user_id": user.id, "role": user.role})
        user_profile = {
            "id": user.id,
            "name": user.name,
            "neptun": user.uid,
            "role": user.role,
            "major": user.major,
            "chosen_specialization_code": getattr(user, "chosen_specialization_code", None),
        }
        return {"access_token": access_token, "token_type": "bearer", "user": user_profile}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post(
    "/refresh-token",
    response_model=schemas.Token,
    summary="Access token frissítése",
    description="Bejelentkezett felhasználó számára új hozzáférési token kiadása.",
)
def refresh_access_token(current_user=Depends(get_current_user)):
    user_id = current_user.get("user_id") or current_user.get("id")
    role = current_user.get("role")
    if not user_id:
        raise HTTPException(status_code=401, detail="Érvénytelen token.")
    access_token = create_access_token({"user_id": int(user_id), "role": role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/change-password", summary="Jelszó módosítása", description="Bejelentkezett felhasználó jelszavának módosítása.")
def change_password(
    payload: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Érvénytelen token.")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Felhasználó nem található.")

    if not verify_password(payload.old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="A régi jelszó hibás.")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Jelszó sikeresen módosítva."}


@router.post("/delete-me", summary="Saját profil végleges törlése", description="Jelszóval megerősített fióktörlés.")
def delete_my_profile(
    payload: schemas.DeleteProfileRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Progress sorok törlése; chat üzenetek megmaradnak. A ``users`` sor anonimizálva marad (FK integritás), nem fizikai DELETE.
    """
    user_id = current_user.get("user_id") or current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Érvénytelen token.")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Felhasználó nem található.")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Hibás jelszó.")

    db.execute(text("DELETE FROM progress WHERE user_id = :uid"), {"uid": int(user_id)})

    token = uuid.uuid4().hex[:10]
    anonymized_uid = f"DEL{int(user_id)}{token[:3]}".upper()[:16]
    anonymized_email = f"deleted+{int(user_id)}-{token}@deleted.local"
    anonymized_name = f"Deleted User {int(user_id)}"
    anonymized_major = "Deleted"
    anonymized_mother = "Deleted"
    anonymized_id_card = f"{int(user_id):06d}DX"
    anonymized_address_card = f"{int(user_id):06d}DA"

    user.uid = anonymized_uid
    user.email = anonymized_email
    user.name = anonymized_name
    user.mothers_name = anonymized_mother
    user.major = anonymized_major
    user.id_card_number = anonymized_id_card
    user.address_card_number = anonymized_address_card
    user.password_hash = hash_password(uuid.uuid4().hex)
    user.verify_token = None
    user.reset_token = None
    user.reset_token_expires = None
    user.verified = False
    user.role = "user"
    user.anonymous_name = f"Deleted#{int(user_id)}"
    user.created_at = user.created_at or datetime.utcnow()
    if hasattr(user, "chosen_specialization_code"):
        user.chosen_specialization_code = None

    db.commit()

    return {"detail": "A profil adatai törölve, a progress adatok törölve, a chat tartalom megőrizve."}