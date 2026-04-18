"""Szakok tábla CRUD - ``MajorsService``."""

from sqlalchemy.orm import Session
from app.db import models, schemas

class MajorsService:
    """
    Szakokhoz tartozó adatbázis műveletek szolgáltatása.

    Metódusok:
        get_majors(skip, limit): Szakok listázása.
        get_major(major_id): Egy szak lekérdezése.
        create_major(major): Új szak létrehozása.
        update_major(major_id, major): Szak adatainak frissítése.
        delete_major(major_id): Szak törlése.
    """
    def __init__(self, db: Session):
        """
        Konstruktor, adatbázis kapcsolat beállítása.
        """
        self.db = db

    def get_majors(self, skip: int = 0, limit: int = 100):
        """
        Szakok lekérdezése.

        Paraméterek:
            skip (int): Hány rekordot hagyjon ki.
            limit (int): Hány rekordot adjon vissza.

        Visszatérés:
            List[Major]: Szakok listája.
        """
        return self.db.query(models.Major).offset(skip).limit(limit).all()

    def get_major(self, major_id: int):
        """
        Egy szak lekérdezése azonosító alapján.

        Paraméterek:
            major_id (int): Szak azonosító.

        Visszatérés:
            Major | None: Szak vagy None.
        """
        return self.db.query(models.Major).filter(models.Major.id == major_id).first()

    def create_major(self, major: schemas.MajorCreate):
        """
        Új szak létrehozása.

        Paraméterek:
            major (MajorCreate): Szak adatai.

        Visszatérés:
            Major: Létrehozott szak.
        """
        db_major = models.Major(**major.dict())
        self.db.add(db_major)
        self.db.commit()
        self.db.refresh(db_major)
        return db_major

    def update_major(self, major_id: int, major: schemas.MajorBase):
        """
        Szak adatainak frissítése.

        Paraméterek:
            major_id (int): Szak azonosító.
            major (MajorBase): Friss adatok.

        Visszatérés:
            Major | None: Frissített szak vagy None.
        """
        db_major = self.get_major(major_id)
        if not db_major:
            return None
        for key, value in major.dict(exclude_unset=True).items():
            setattr(db_major, key, value)
        self.db.commit()
        self.db.refresh(db_major)
        return db_major

    def delete_major(self, major_id: int):
        """
        Szak törlése.

        Paraméterek:
            major_id (int): Szak azonosító.

        Visszatérés:
            Major | None: Törölt szak vagy None.
        """
        db_major = self.get_major(major_id)
        if not db_major:
            return None
        self.db.delete(db_major)
        self.db.commit()
        return db_major
