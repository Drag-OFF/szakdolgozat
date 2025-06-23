from sqlalchemy.orm import Session
from app.db.models import Progress as ProgressModel
from app.db.schemas import Progress, ProgressCreate, ProgressUpdate

class ProgressService:
    def __init__(self, db: Session):
        self.db = db

    def get_progress(self, skip: int = 0, limit: int = 100) -> list[ProgressModel]:
        """
        Az összes haladás lekérdezése.

        Args:
            skip (int): Kihagyandó rekordok száma.
            limit (int): Visszaadandó rekordok száma.

        Returns:
            list[ProgressModel]: Haladások listája.
        """
        return self.db.query(ProgressModel).offset(skip).limit(limit).all()

    def create_progress(self, progress_data: ProgressCreate) -> Progress:
        """
        Haladás létrehozása.

        Args:
            progress_data (ProgressCreate): A létrehozandó haladás adatai.

        Returns:
            Progress: A létrehozott haladás objektum.
        """
        progress = Progress(**progress_data.dict())
        self.db.add(progress)
        self.db.commit()
        self.db.refresh(progress)
        return progress

    def get_progress_by_user(self, user_id: int) -> list[Progress]:
        """
        Haladás lekérdezése felhasználó szerint.

        Args:
            user_id (int): A felhasználó azonosítója.

        Returns:
            list[Progress]: A felhasználóhoz tartozó haladások listája.
        """
        return self.db.query(Progress).filter(Progress.user_id == user_id).all()

    def update_progress(self, progress_id: int, progress_data: ProgressUpdate) -> Progress:
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
        progress = self.db.query(Progress).filter(Progress.id == progress_id).first()
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
        progress = self.db.query(Progress).filter(Progress.id == progress_id).first()
        if progress:
            self.db.delete(progress)
            self.db.commit()