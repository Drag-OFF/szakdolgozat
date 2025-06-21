from sqlalchemy.orm import Session
from app.db.models import  User as UserModel
from app.db.schemas import User, UserCreate, UserUpdate
import uuid

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
    
    def create_user(self, user_data: UserCreate):
        """
        Új felhasználó létrehozása.

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

        # Új user példány létrehozása
        db_user = UserModel(**user_data.dict(), verify_token=verify_token, verified=False)
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)

        return db_user