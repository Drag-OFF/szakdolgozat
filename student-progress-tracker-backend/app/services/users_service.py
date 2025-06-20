from sqlalchemy.orm import Session
from app.db.models import  User as UserModel
from app.db.schemas import User, UserCreate, UserUpdate

class UsersService:
    def __init__(self, db: Session):
        self.db = db

    def list_users(self):
        return self.db.query(UserModel).all()