from sqlalchemy.orm import Session
from app.db.models import User as UserModel
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_password(db: Session, token: str, new_password: str):
    """
    Megkeresi a felhasználót a reset_token alapján, ellenőrzi a lejáratot,
    majd beállítja az új hash-elt jelszót, törli a reset_token-t.
    """
    user = db.query(UserModel).filter(UserModel.reset_token == token).first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        return False, "Érvénytelen vagy lejárt token."
    user.password_hash = pwd_context.hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return True, "Sikeres jelszóváltoztatás."