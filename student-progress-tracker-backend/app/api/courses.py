from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db import schemas
from app.db.database import get_db
from app.services.courses_service import CoursesService
from app.utils.utils import get_current_user

router = APIRouter()


@router.post("", response_model=schemas.Course)
def create_course(
    course: schemas.CourseCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    """
    Új kurzus létrehozása (csak hitelesített user).
    """
    courses_service = CoursesService(db)
    try:
        return courses_service.create_course(course)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[schemas.Course])
def get_courses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    """
    Kurzusok lekérdezése (csak hitelesített user).
    """
    courses_service = CoursesService(db)
    return courses_service.get_courses(skip=skip, limit=limit)


@router.get("/{course_id}", response_model=schemas.Course)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    """
    Egy adott kurzus lekérdezése azonosító alapján (csak hitelesített user).
    """
    courses_service = CoursesService(db)
    try:
        return courses_service.get_course(course_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{course_id}", response_model=schemas.Course)
def update_course(
    course_id: int,
    course: schemas.CourseUpdate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    """
    Egy kurzus frissítése azonosító alapján (csak hitelesített user).
    """
    courses_service = CoursesService(db)
    try:
        updated_course = courses_service.update_course(course_id, course)
        return updated_course
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{course_id}", response_model=dict)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    """
    Egy kurzus törlése azonosító alapján (csak hitelesített user).
    """
    courses_service = CoursesService(db)
    try:
        success = courses_service.delete_course(course_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"detail": "Course deleted successfully"}