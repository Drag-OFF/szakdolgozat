from sqlalchemy.orm import Session
from app.db.models import User as UserModel
from app.db.schemas import User, UserCreate, UserUpdate, UserLogin
from app.utils import hash_password, verify_password
import uuid
from typing import Optional

class UsersService:
    def __init__(self, db: Session):
        """
        UsersService inicializálása.

        Args:
            db (Session): SQLAlchemy adatbázis kapcsolat.
        """
        self.db = db

    def list_users(self):
        """
        Az összes felhasználó lekérdezése.

        Returns:
            list[UserModel]: Az összes felhasználó listája.
        """
        return self.db.query(UserModel).all()
    
    def create_user(self, user_data: UserCreate) -> UserModel:
        """
        Új felhasználó létrehozása, jelszó hash-eléssel és verifikációs token generálással.

        Args:
            user_data (UserCreate): A létrehozandó felhasználó adatai.

        Returns:
            UserModel: A létrehozott felhasználó példánya.

        Raises:
            Exception: Ha a felhasználó már létezik.
        """
        # Létezik-e már ilyen e-mail vagy NEPTUN
        if self.db.query(UserModel).filter(
            (UserModel.email == user_data.email) | (UserModel.uid == user_data.uid)
        ).first():
            raise Exception("A felhasználó már létezik ezzel az e-mail címmel vagy NEPTUN kóddal.")

        # Verifikációs token generálása
        verify_token = str(uuid.uuid4())

        # Jelszó hash-elése
        hashed_pw = hash_password(user_data.password_hash)

        # Új user példány létrehozása
        db_user = UserModel(
            **user_data.dict(exclude={"password_hash"}),
            password_hash=hashed_pw,
            verify_token=verify_token,
            verified=False
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)

        return db_user

    def login_user(self, login_data: UserLogin) -> Optional[UserModel]:
        """
        Felhasználó bejelentkeztetése e-mail vagy NEPTUN kód és jelszó alapján.

        Args:
            login_data (UserLogin): A bejelentkezési adatok (e-mail vagy uid, jelszó).

        Returns:
            UserModel: A bejelentkezett felhasználó példánya, ha sikeres a bejelentkezés.

        Raises:
            Exception: Hibás felhasználónév vagy jelszó esetén.
        """
        # Felhasználó keresése e-mail vagy uid alapján
        user = self.db.query(UserModel).filter(
            (UserModel.email == login_data.email) | (UserModel.uid == login_data.uid)
        ).first()
        if not user or not verify_password(login_data.password, user.password_hash):
            raise Exception("Hibás felhasználónév vagy jelszó.")
        return user