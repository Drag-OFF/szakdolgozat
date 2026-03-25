from sqlalchemy.orm import Session
from app.db import models
from typing import List, Any

class ProgressService:
    def __init__(self, db: Session):
        self.db = db

    def get_progress(self, skip: int = 0, limit: int = 100) -> list[models.Progress]:
        """
        Az összes haladás lekérdezése.

        Args:
            skip (int): Kihagyandó rekordok száma.
            limit (int): Visszaadandó rekordok száma.

        Returns:
            list[Progress]: Haladások listája.
        """
        return self.db.query(models.Progress).offset(skip).limit(limit).all()

    def create_progress(self, progress_data) -> models.Progress:
        """
        Haladás létrehozása.

        Args:
            progress_data (ProgressCreate): A létrehozandó haladás adatai.

        Returns:
            Progress: A létrehozott haladás objektum.
        """
        progress = models.Progress(**progress_data.dict())
        self.db.add(progress)
        self.db.commit()
        self.db.refresh(progress)
        return progress

    def get_user_progress(self, user_id: int) -> list[models.Progress]:
        """
        Haladás lekérdezése felhasználó szerint.

        Args:
            user_id (int): A felhasználó azonosítója.

        Returns:
            list[Progress]: A felhasználóhoz tartozó haladások listája.
        """
        return self.db.query(models.Progress).filter(models.Progress.user_id == user_id).all()

    def update_progress(self, progress_id: int, progress_data) -> models.Progress:
        """
        Haladás frissítése.

        Args:
            progress_id (int): A frissítendő haladás azonosítója.
            progress_data (ProgressUpdate): A frissítési adatok.

        Returns:
            Progress: A frissített haladás objektum.

        Raises:
            ValueError: Ha a haladás nem található.
        """
        progress = self.db.query(models.Progress).filter(models.Progress.id == progress_id).first()
        if not progress:
            raise ValueError("Progress not found")
        for key, value in progress_data.dict(exclude_unset=True).items():
            setattr(progress, key, value)
        self.db.commit()
        self.db.refresh(progress)
        return progress

    def delete_progress(self, progress_id: int) -> None:
        """
        Haladás törlése.

        Args:
            progress_id (int): A törlendő haladás azonosítója.
        """
        progress = self.db.query(models.Progress).filter(models.Progress.id == progress_id).first()
        if progress:
            self.db.delete(progress)
            self.db.commit()

    def get_user_completed_courses(self, user_id: int) -> list[models.Progress]:
        """
        Visszaadja a felhasználó összes teljesített kurzusát.

        Args:
            user_id (int): A felhasználó azonosítója.

        Returns:
            list[Progress]: A felhasználóhoz tartozó, 'completed' státuszú kurzusok listája.
        """
        return self.db.query(models.Progress).filter(
            models.Progress.user_id == user_id,
            models.Progress.status == "completed"
        ).all()

    def get_user_in_progress_courses(self, user_id: int) -> list[models.Progress]:
        """
        Visszaadja a felhasználó összes folyamatban lévő kurzusát.

        Args:
            user_id (int): A felhasználó azonosítója.

        Returns:
            list[Progress]: A felhasználóhoz tartozó, 'in_progress' státuszú kurzusok listája.
        """
        return self.db.query(models.Progress).filter(
            models.Progress.user_id == user_id,
            models.Progress.status == "in_progress"
        ).all()

    def get_user_progress_export_rows(self, user_id: int) -> List[List[Any]]:
        """
        Visszaadja a felhasználó exportálható előrehaladási adatait soronként (Excel/CSV-hez).

        Args:
            user_id (int): A felhasználó azonosítója.

        Returns:
            List[List[Any]]: Sorok listája, minden sor egy kurzus adatait tartalmazza.
        """
        status_map = {
            "completed": "Teljesítve",
            "in_progress": "Folyamatban",
            "failed": "Nem teljesítve"
        }
        category_map = {
            "required": "Kötelező",
            "elective": "Kötelezően választható",
            "optional": "Szabadon választható",
            "pe": "Testnevelés",
            "practice": "Szakmai gyakorlat",
            "thesis": "Szakdolgozat"
        }
        rows = []
        progresses = self.get_user_progress(user_id)
        for p in progresses:
            course = self.db.query(models.Course).filter(models.Course.id == p.course_id).first()
            cm = self.db.query(models.CourseMajor).filter(
                models.CourseMajor.course_id == p.course_id
            ).first()
            status = status_map.get(p.status, p.status)
            category = category_map.get(cm.type if cm else "", cm.type if cm else "")
            rows.append([
                course.course_code if course else "",
                course.name if course else "",
                cm.credit if cm else "",
                status,
                p.completed_semester if p.completed_semester is not None else "-",
                p.points if p.points is not None else "-",
                category
            ])
        return rows
