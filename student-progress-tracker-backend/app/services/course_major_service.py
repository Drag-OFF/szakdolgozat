"""Mintatanterv sorok (kurzus–szak) CRUD - ``CourseMajorService``."""

from sqlalchemy.orm import Session
from app.db import models, schemas

class CourseMajorService:
    """
    Kurzus-szak kapcsolatokhoz tartozó adatbázis műveletek szolgáltatása.

    Metódusok:
        get_all(skip, limit): Kapcsolatok listázása.
        get_by_id(cm_id): Egy kapcsolat lekérdezése.
        create(cm): Új kapcsolat létrehozása.
        update(cm_id, cm): Kapcsolat frissítése.
        delete(cm_id): Kapcsolat törlése.
    """
    def __init__(self, db: Session):
        """
        Konstruktor, adatbázis kapcsolat beállítása.
        """
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100):
        """
        Kapcsolatok lekérdezése.

        Paraméterek:
            skip (int): Hány rekordot hagyjon ki.
            limit (int): Hány rekordot adjon vissza.

        Visszatérés:
            List[CourseMajor]: Kapcsolatok listája.
        """
        return self.db.query(models.CourseMajor).offset(skip).limit(limit).all()

    def get_by_id(self, cm_id: int):
        """
        Egy kapcsolat lekérdezése azonosító alapján.

        Paraméterek:
            cm_id (int): Kapcsolat azonosító.

        Visszatérés:
            CourseMajor | None: Kapcsolat vagy None.
        """
        return self.db.query(models.CourseMajor).filter(models.CourseMajor.id == cm_id).first()

    def create(self, cm: schemas.CourseMajorCreate):
        """
        Új kapcsolat létrehozása.

        Paraméterek:
            cm (CourseMajorCreate): Kapcsolat adatai.

        Visszatérés:
            CourseMajor: Létrehozott kapcsolat.
        """
        db_cm = models.CourseMajor(**cm.dict())
        self.db.add(db_cm)
        self.db.commit()
        self.db.refresh(db_cm)
        return db_cm

    def update(self, cm_id: int, cm: schemas.CourseMajorBase):
        """
        Kapcsolat frissítése.

        Paraméterek:
            cm_id (int): Kapcsolat azonosító.
            cm (CourseMajorBase): Friss adatok.

        Visszatérés:
            CourseMajor | None: Frissített kapcsolat vagy None.
        """
        db_cm = self.get_by_id(cm_id)
        if not db_cm:
            return None
        for key, value in cm.dict(exclude_unset=True).items():
            setattr(db_cm, key, value)
        self.db.commit()
        self.db.refresh(db_cm)
        return db_cm

    def delete(self, cm_id: int):
        """
        Kapcsolat törlése.

        Paraméterek:
            cm_id (int): Kapcsolat azonosító.

        Visszatérés:
            CourseMajor | None: Törölt kapcsolat vagy None.
        """
        db_cm = self.get_by_id(cm_id)
        if not db_cm:
            return None
        self.db.delete(db_cm)
        self.db.commit()
        return db_cm
