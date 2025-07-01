from sqlalchemy.orm import Session
from app.db.models import Course as CourseModel
from app.db.schemas import Course, CourseCreate, CourseUpdate

class CoursesService:
    def __init__(self, db: Session):
        """
        CoursesService inicializálása.

        Args:
            db (Session): SQLAlchemy adatbázis kapcsolat.
        """
        self.db = db

    def create_course(self, course_data: CourseCreate) -> CourseModel:
        """
        Új kurzus létrehozása.

        Args:
            course_data (CourseCreate): A létrehozandó kurzus adatai.

        Returns:
            CourseModel: A létrehozott kurzus példánya.
        """
        course = CourseModel(**course_data.dict())
        self.db.add(course)
        self.db.commit()
        self.db.refresh(course)
        return course

    def get_courses(self, skip: int = 0, limit: int = 100) -> list[CourseModel]:
        """
        Az összes kurzus lekérdezése.

        Args:
            skip (int): Kihagyandó rekordok száma.
            limit (int): Visszaadandó rekordok száma.

        Returns:
            list[CourseModel]: Kurzusok listája.
        """
        return self.db.query(CourseModel).offset(skip).limit(limit).all()

    def get_course(self, course_id: int) -> CourseModel:
        """
        Egy kurzus lekérdezése azonosító alapján.

        Args:
            course_id (int): A kurzus azonosítója.

        Returns:
            CourseModel: A megtalált kurzus példánya.

        Raises:
            Exception: Ha a kurzus nem található.
        """
        course = self.db.query(CourseModel).filter(CourseModel.id == course_id).first()
        if not course:
            raise Exception("Kurzus nem található.")
        return course

    def update_course(self, course_id: int, course_data: CourseUpdate) -> CourseModel:
        """
        Kurzus adatainak frissítése.

        Args:
            course_id (int): A frissítendő kurzus azonosítója.
            course_data (CourseUpdate): A frissítési adatok.

        Returns:
            CourseModel: A frissített kurzus példánya.

        Raises:
            Exception: Ha a kurzus nem található.
        """
        course = self.db.query(CourseModel).filter(CourseModel.id == course_id).first()
        if not course:
            raise Exception("Kurzus nem található.")
        for key, value in course_data.dict(exclude_unset=True).items():
            setattr(course, key, value)
        self.db.commit()
        self.db.refresh(course)
        return course

    def delete_course(self, course_id: int) -> None:
        """
        Kurzus törlése azonosító alapján.

        Args:
            course_id (int): A törlendő kurzus azonosítója.

        Raises:
            Exception: Ha a kurzus nem található.
        """
        course = self.db.query(CourseModel).filter(CourseModel.id == course_id).first()
        if not course:
            raise Exception("Kurzus nem található.")
        self.db.delete(course)
        self.db.commit()