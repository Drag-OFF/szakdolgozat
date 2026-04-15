"""JWT, jelszó hash, ``get_current_user`` / admin függőségek, státusz normalizálás importokhoz."""

from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .translations import STATUS_MAP, ERROR_MESSAGES
from app.config import JWT_SECRET_KEY


SECRET_KEY = JWT_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Jelszó hash-elése bcrypt algoritmussal.

    Paraméterek:
        password (str): A felhasználó jelszava.

    Visszatérés:
        str: A hash-elt jelszó.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Jelszó ellenőrzése a hash-elt jelszóval.

    Paraméterek:
        plain_password (str): A felhasználó által megadott jelszó.
        hashed_password (str): Az adatbázisban tárolt hash-elt jelszó.

    Visszatérés:
        bool: True, ha egyezik, különben False.
    """
    return pwd_context.verify(plain_password, hashed_password)

security = HTTPBearer()
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    """
    JWT token ellenőrzése és payload visszaadása.

    Paraméterek:
        credentials (HTTPAuthorizationCredentials): A kérésben kapott token.

    Visszatérés:
        dict: A tokenben lévő payload (pl. user_id, role).

    Raises:
        HTTPException: Ha a token hiányzik vagy érvénytelen.
    """
    token = credentials.credentials
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Érvénytelen vagy hiányzó token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

def admin_required(user=Depends(get_current_user)):
    """
    Csak admin jogosultságú felhasználó férhet hozzá.

    Paraméterek:
        user (dict): A JWT tokenből kinyert payload.

    Visszatérés:
        dict: A payload, ha admin.

    Raises:
        HTTPException: Ha a felhasználó nem admin.
    """
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Nincs jogosultság")
    return user

def normalize_status(raw):
    """
    Elfogad magyar és angol megnevezéseket, visszaadja a canonical kulcsot:
    'completed' vagy 'in_progress', vagy None ha nem értelmezhető.
    """
    if raw is None:
        return None
    s = str(raw).strip().lower().replace(" ", "_")
    translations = {}
    for k, v in STATUS_MAP.get("hu", {}).items():
        translations[v.lower().replace(" ", "_")] = k
    for k, v in STATUS_MAP.get("en", {}).items():
        translations[v.lower().replace(" ", "_")] = k
    translations.update({"completed": "completed", "in_progress": "in_progress", "inprogress": "in_progress"})
    return translations.get(s)

def parse_int(value):
    """
    Megpróbál int-re konvertálni; visszatér (int vagy None, hiba_uzenet vagy None).
    """
    if value is None or str(value).strip() == "":
        return None, None
    try:
        if isinstance(value, float):
            return int(value), None
        return int(str(value).strip()), None
    except Exception as e:
        return None, str(e)

def get_error_message(key, lang="hu", **kwargs):
    """
    Lokalizált hibaüzenet lekérése és formázása.
    """
    tmpl = ERROR_MESSAGES.get(key, {}).get(lang)
    if not tmpl:
        tmpl = ERROR_MESSAGES.get(key, {}).get("hu", "") 
    return tmpl.format(**kwargs)
