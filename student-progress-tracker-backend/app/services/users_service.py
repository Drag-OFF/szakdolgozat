from sqlalchemy.orm import Session
from app.db.models import User as UserModel
from app.db.schemas import User, UserCreate, UserUpdate, UserLogin
from passlib.context import CryptContext
from app.utils import hash_password, verify_password
import uuid
from typing import Optional
from datetime import datetime, timedelta

class UsersService:
    def __init__(self, db: Session):
        """
        UsersService inicializálása.

        Args:
            db (Session): SQLAlchemy adatbázis kapcsolat.
        """
        self.db = db

    def list_users(self) -> list[UserModel]:
        """
        Az összes felhasználó lekérdezése.

        Returns:
            list[UserModel]: Az összes felhasználó listája.
        """
        return self.db.query(UserModel).all()
    
    def get_user(self, user_id: int) -> Optional[UserModel]:
        """
        Egy felhasználó lekérdezése azonosító alapján.

        Args:
            user_id (int): A felhasználó azonosítója.

        Returns:
            UserModel vagy None: A megtalált felhasználó példánya, vagy None ha nincs ilyen.
        """
        return self.db.query(UserModel).filter(UserModel.id == user_id).first()
    
    def create_user(self, user_data: UserCreate) -> UserModel:
        """
        Új felhasználó létrehozása, jelszó hash-eléssel és verifikációs token generálással.

        Args:
            user_data (UserCreate): A létrehozandó felhasználó adatai.

        Returns:
            UserModel: A létrehozott felhasználó példánya.

        Raises:
            Exception: Ha a felhasználó már létezik ezzel az e-mail címmel vagy NEPTUN kóddal.
        """
        if self.db.query(UserModel).filter(
            (UserModel.email == user_data.email) | (UserModel.uid == user_data.uid)
        ).first():
            raise Exception("A felhasználó már létezik ezzel az e-mail címmel vagy NEPTUN kóddal.")

        verify_token = str(uuid.uuid4())
        hashed_pw = hash_password(user_data.password)
        db_user = UserModel(
            **user_data.dict(exclude={"password"}),
            password_hash=hashed_pw,
            verify_token=verify_token,
            verified=False
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def update_user(self, user_id: int, user_data: UserUpdate) -> Optional[UserModel]:
        """
        Felhasználó adatainak frissítése.

        Args:
            user_id (int): A frissítendő felhasználó azonosítója.
            user_data (UserUpdate): A frissítendő adatok.

        Returns:
            UserModel vagy None: A frissített felhasználó példánya, vagy None ha nincs ilyen.

        Raises:
            Exception: Ha a felhasználó nem található.
        """
        user = self.db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            return None
        for key, value in user_data.dict(exclude_unset=True).items():
            setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user_id: int) -> bool:
        """
        Felhasználó törlése azonosító alapján.

        Args:
            user_id (int): A törlendő felhasználó azonosítója.

        Returns:
            bool: True, ha sikeres volt a törlés, különben False.
        """
        user = self.db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            return False
        self.db.delete(user)
        self.db.commit()
        return True

    def login_user(self, login_data: UserLogin) -> Optional[UserModel]:
        """
        Felhasználó bejelentkeztetése e-mail vagy NEPTUN kód és jelszó alapján.

        Args:
            login_data (UserLogin): A bejelentkezési adatok (e-mail vagy uid, jelszó).

        Returns:
            UserModel: A bejelentkezett felhasználó példánya, ha sikeres a bejelentkezés.

        Raises:
            Exception: Hibás felhasználónév, jelszó vagy nincs verifikálva.
        """
        user = self.db.query(UserModel).filter(
            (UserModel.email == login_data.email) | (UserModel.uid == login_data.uid)
        ).first()
        if not user or not verify_password(login_data.password, user.password_hash):
            raise Exception("Hibás felhasználónév vagy jelszó.")
        if not user.verified:
            raise Exception("A fiók még nincs verifikálva. Kérjük, erősítsd meg az e-mail címedet!")
        return user