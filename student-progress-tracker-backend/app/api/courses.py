from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db import schemas
from app.db.database import get_db
from app.services.courses_service import CoursesService
from app.utils import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.Course, dependencies=[Depends(get_current_user)])
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    """
    Új kurzus létrehozása.

    Args:
        course (schemas.CourseCreate): Az új kurzus adatai.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.Course: A létrehozott kurzus.

    Raises:
        HTTPException: Ha a kurzus létrehozása nem sikerül.
    """
    courses_service = CoursesService(db)
    try:
        return courses_service.create_course(course)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[schemas.Course], dependencies=[Depends(get_current_user)])
def get_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Kurzusok lekérdezése.

    Args:
        skip (int): A kihagyandó kurzusok száma.
        limit (int): A visszaadandó kurzusok maximális száma.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        list[schemas.Course]: A kurzusok listája.
    """
    courses_service = CoursesService(db)
    return courses_service.get_courses(skip=skip, limit=limit)

@router.get("/{course_id}", response_model=schemas.Course)
def get_course(course_id: int, db: Session = Depends(get_db)):
    """
    Egy adott kurzus lekérdezése azonosító alapján.

    Args:
        course_id (int): A lekérdezni kívánt kurzus azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.Course: A lekérdezett kurzus.

    Raises:
        HTTPException: Ha a kurzus nem található.
    """
    courses_service = CoursesService(db)
    course = courses_service.get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.put("/{course_id}", response_model=schemas.Course)
def update_course(course_id: int, course: schemas.CourseUpdate, db: Session = Depends(get_db)):
    """
    Egy kurzus frissítése azonosító alapján.

    Args:
        course_id (int): A frissítendő kurzus azonosítója.
        course (schemas.CourseUpdate): A frissített kurzus adatai.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.Course: A frissített kurzus.

    Raises:
        HTTPException: Ha a kurzus nem található vagy a frissítés nem sikerül.
    """
    courses_service = CoursesService(db)
    updated_course = courses_service.update_course(course_id, course)
    if updated_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return updated_course

@router.delete("/{course_id}", response_model=dict)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """
    Egy kurzus törlése azonosító alapján.

    Args:
        course_id (int): A törlendő kurzus azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        dict: A törlés sikerességéről szóló üzenet.

    Raises:
        HTTPException: Ha a kurzus nem található.
    """
    courses_service = CoursesService(db)
    success = courses_service.delete_course(course_id)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"detail": "Course deleted successfully"}