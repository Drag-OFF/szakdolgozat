from sqlalchemy.orm import Session


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    # Itt lesznek a regisztráció, login stb. metódusok
    # Pl.:
    # def register(self, user_data): ...
    # def login(self, login_data): ...