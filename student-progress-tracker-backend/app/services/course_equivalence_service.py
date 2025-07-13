from sqlalchemy.orm import Session
from app.db import models, schemas

class CourseEquivalenceService:
    """
    Kurzus ekvivalenciákhoz tartozó adatbázis műveletek szolgáltatása.

    Metódusok:
        get_all(skip, limit): Ekvivalenciák listázása.
        get_by_id(eq_id): Egy ekvivalencia lekérdezése.
        create(eq): Új ekvivalencia létrehozása.
        update(eq_id, eq): Ekvivalencia frissítése.
        delete(eq_id): Ekvivalencia törlése.
    """
    def __init__(self, db: Session):
        """
        Konstruktor, adatbázis kapcsolat beállítása.
        """
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100):
        """
        Ekvivalenciák lekérdezése.

        Args:
            skip (int): Hány rekordot hagyjon ki.
            limit (int): Hány rekordot adjon vissza.

        Returns:
            List[CourseEquivalence]: Ekvivalenciák listája.
        """
        return self.db.query(models.CourseEquivalence).offset(skip).limit(limit).all()

    def get_by_id(self, eq_id: int):
        """
        Egy ekvivalencia lekérdezése azonosító alapján.

        Args:
            eq_id (int): Ekvivalencia azonosító.

        Returns:
            CourseEquivalence | None: Ekvivalencia vagy None.
        """
        return self.db.query(models.CourseEquivalence).filter(models.CourseEquivalence.id == eq_id).first()

    def create(self, eq: schemas.CourseEquivalenceCreate):
        """
        Új ekvivalencia létrehozása.

        Args:
            eq (CourseEquivalenceCreate): Ekvivalencia adatai.

        Returns:
            CourseEquivalence: Létrehozott ekvivalencia.
        """
        db_eq = models.CourseEquivalence(**eq.dict())
        self.db.add(db_eq)
        self.db.commit()
        self.db.refresh(db_eq)
        return db_eq

    def update(self, eq_id: int, eq: schemas.CourseEquivalenceBase):
        """
        Ekvivalencia frissítése.

        Args:
            eq_id (int): Ekvivalencia azonosító.
            eq (CourseEquivalenceBase): Friss adatok.

        Returns:
            CourseEquivalence | None: Frissített ekvivalencia vagy None.
        """
        db_eq = self.get_by_id(eq_id)
        if not db_eq:
            return None
        for key, value in eq.dict(exclude_unset=True).items():
            setattr(db_eq, key, value)
        self.db.commit()
        self.db.refresh(db_eq)
        return db_eq

    def delete(self, eq_id: int):
        """
        Ekvivalencia törlése.

        Args:
            eq_id (int): Ekvivalencia azonosító.

        Returns:
            CourseEquivalence | None: Törölt ekvivalencia vagy None.
        """
        db_eq = self.get_by_id(eq_id)
        if not db_eq:
            return None
        self.db.delete(db_eq)
        self.db.commit()
        return db_eq