from passlib.context import CryptContext

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