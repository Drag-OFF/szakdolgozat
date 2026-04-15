"""Összesített szak követelmény tábla CRUD — ``MajorsRequirementsService``."""

from sqlalchemy.orm import Session
from app.db import models, schemas

class MajorsRequirementsService:
    """
    Szak követelményekhez tartozó adatbázis műveletek szolgáltatása.

    Metódusok:
        get_all(skip, limit): Követelmények listázása.
        get_by_id(req_id): Egy követelmény lekérdezése.
        create(req): Új követelmény létrehozása.
        update(req_id, req): Követelmény frissítése.
        delete(req_id): Követelmény törlése.
    """
    def __init__(self, db: Session):
        """
        Konstruktor, adatbázis kapcsolat beállítása.
        """
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100):
        """
        Követelmények lekérdezése.

        Paraméterek:
            skip (int): Hány rekordot hagyjon ki.
            limit (int): Hány rekordot adjon vissza.

        Visszatérés:
            List[MajorRequirement]: Követelmények listája.
        """
        return self.db.query(models.MajorRequirement).offset(skip).limit(limit).all()

    def get_by_id(self, req_id: int):
        """
        Egy követelmény lekérdezése azonosító alapján.

        Paraméterek:
            req_id (int): Követelmény azonosító.

        Visszatérés:
            MajorRequirement | None: Követelmény vagy None.
        """
        return self.db.query(models.MajorRequirement).filter(models.MajorRequirement.id == req_id).first()

    def get_by_major_id(self, major_id: int):
        """
        Egy követelmény lekérdezése `major_id` alapján.
        Feltételezzük, hogy egy szakhoz egy darab követelmény sor tartozik.
        """
        return self.db.query(models.MajorRequirement).filter(models.MajorRequirement.major_id == major_id).first()

    def create(self, req: schemas.MajorRequirementCreate):
        """
        Új követelmény létrehozása.

        Paraméterek:
            req (MajorRequirementCreate): Követelmény adatai.

        Visszatérés:
            MajorRequirement: Létrehozott követelmény.
        """
        db_req = models.MajorRequirement(**req.dict())
        self.db.add(db_req)
        self.db.commit()
        self.db.refresh(db_req)
        return db_req

    def update(self, req_id: int, req: schemas.MajorRequirementBase):
        """
        Követelmény frissítése.

        Paraméterek:
            req_id (int): Követelmény azonosító.
            req (MajorRequirementBase): Friss adatok.

        Visszatérés:
            MajorRequirement | None: Frissített követelmény vagy None.
        """
        db_req = self.get_by_id(req_id)
        if not db_req:
            return None
        for key, value in req.dict(exclude_unset=True).items():
            setattr(db_req, key, value)
        self.db.commit()
        self.db.refresh(db_req)
        return db_req

    def delete(self, req_id: int):
        """
        Követelmény törlése.

        Paraméterek:
            req_id (int): Követelmény azonosító.

        Visszatérés:
            MajorRequirement | None: Törölt követelmény vagy None.
        """
        db_req = self.get_by_id(req_id)
        if not db_req:
            return None
        self.db.delete(db_req)
        self.db.commit()
        return db_req
