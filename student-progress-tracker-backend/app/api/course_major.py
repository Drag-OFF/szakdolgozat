from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import schemas
from app.db.database import get_db
from app.services.course_major_service import CourseMajorService
from app.utils.utils import get_current_user

router = APIRouter()

@router.get("/", response_model=list[schemas.CourseMajor], dependencies=[Depends(get_current_user)])
def get_course_majors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Kurzus-szak kapcsolatok lekérdezése.

    Args:
        skip (int): Hány rekordot hagyjon ki.
        limit (int): Hány rekordot adjon vissza.
        db (Session): Adatbázis kapcsolat.

    Returns:
        list[schemas.CourseMajor]: Kapcsolatok listája.
    """
    service = CourseMajorService(db)
    return service.get_all(skip, limit)

@router.get("/{cm_id}", response_model=schemas.CourseMajor, dependencies=[Depends(get_current_user)])
def get_course_major(cm_id: int, db: Session = Depends(get_db)):
    """
    Egy kurzus-szak kapcsolat lekérdezése azonosító alapján.

    Args:
        cm_id (int): Kapcsolat azonosító.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.CourseMajor: Kapcsolat adatai.

    Raises:
        HTTPException: Ha a kapcsolat nem található.
    """
    service = CourseMajorService(db)
    cm = service.get_by_id(cm_id)
    if not cm:
        raise HTTPException(status_code=404, detail="CourseMajor not found")
    return cm

@router.post("/", response_model=schemas.CourseMajor, dependencies=[Depends(get_current_user)])
def create_course_major(cm: schemas.CourseMajorCreate, db: Session = Depends(get_db)):
    """
    Új kurzus-szak kapcsolat létrehozása.

    Args:
        cm (schemas.CourseMajorCreate): Kapcsolat adatai.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.CourseMajor: Létrehozott kapcsolat.
    """
    service = CourseMajorService(db)
    return service.create(cm)

@router.put("/{cm_id}", response_model=schemas.CourseMajor, dependencies=[Depends(get_current_user)])
def update_course_major(cm_id: int, cm: schemas.CourseMajorBase, db: Session = Depends(get_db)):
    """
    Kapcsolat frissítése.

    Args:
        cm_id (int): Kapcsolat azonosító.
        cm (schemas.CourseMajorBase): Friss adatok.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.CourseMajor: Frissített kapcsolat.

    Raises:
        HTTPException: Ha a kapcsolat nem található.
    """
    service = CourseMajorService(db)
    updated = service.update(cm_id, cm)
    if not updated:
        raise HTTPException(status_code=404, detail="CourseMajor not found")
    return updated

@router.delete("/{cm_id}", response_model=schemas.CourseMajor, dependencies=[Depends(get_current_user)])
def delete_course_major(cm_id: int, db: Session = Depends(get_db)):
    """
    Kapcsolat törlése.

    Args:
        cm_id (int): Kapcsolat azonosító.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.CourseMajor: Törölt kapcsolat.

    Raises:
        HTTPException: Ha a kapcsolat nem található.
    """
    service = CourseMajorService(db)
    deleted = service.delete(cm_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="CourseMajor not found")
    return deleted