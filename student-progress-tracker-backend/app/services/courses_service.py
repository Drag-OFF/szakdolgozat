from sqlalchemy.orm import Session
from app.db.models import Course as CourseModel
from app.db.schemas import Course, CourseCreate, CourseUpdate

class CoursesService:
    def __init__(self, db: Session):
        self.db = db

    # Itt lesznek a kurzus CRUD metódusok
    # Pl.:
    # def create_course(self, course_data): ...
    # def get_course(self, course_id): ...
    # def update_course(self, course_id, course_data): ...
    # def delete_course(self, course_id): ...
