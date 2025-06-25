from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


SECRET_KEY = "nagyon-titkos-jelszo"
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

    Args:
        password (str): A felhasználó jelszava.

    Returns:
        str: A hash-elt jelszó.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Jelszó ellenőrzése a hash-elt jelszóval.

    Args:
        plain_password (str): A felhasználó által megadott jelszó.
        hashed_password (str): Az adatbázisban tárolt hash-elt jelszó.

    Returns:
        bool: True, ha egyezik, különben False.
    """
    return pwd_context.verify(plain_password, hashed_password)

security = HTTPBearer()
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    """
    JWT token ellenőrzése és payload visszaadása.

    Args:
        credentials (HTTPAuthorizationCredentials): A kérésben kapott token.

    Returns:
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

    Args:
        user (dict): A JWT tokenből kinyert payload.

    Returns:
        dict: A payload, ha admin.

    Raises:
        HTTPException: Ha a felhasználó nem admin.
    """
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Nincs jogosultság")
    return user