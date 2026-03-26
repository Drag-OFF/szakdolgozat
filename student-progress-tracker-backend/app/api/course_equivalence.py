from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import schemas
from app.db.database import get_db
from app.services.course_equivalence_service import CourseEquivalenceService
from app.utils.utils import get_current_user, admin_required

router = APIRouter()


@router.get("", response_model=List[schemas.CourseEquivalence], dependencies=[Depends(get_current_user)])
def get_course_equivalences(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Kurzus ekvivalenciák lekérdezése.

    Args:
        skip (int): Hány rekordot hagyjon ki.
        limit (int): Hány rekordot adjon vissza.
        db (Session): Adatbázis kapcsolat.

    Returns:
        list[schemas.CourseEquivalence]: Ekvivalenciák listája.
    """
    service = CourseEquivalenceService(db)
    return service.get_all(skip, limit)

@router.get("/{eq_id}", response_model=schemas.CourseEquivalence, dependencies=[Depends(get_current_user)])
def get_course_equivalence(eq_id: int, db: Session = Depends(get_db)):
    """
    Egy kurzus ekvivalencia lekérdezése azonosító alapján.

    Args:
        eq_id (int): Ekvivalencia azonosító.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.CourseEquivalence: Ekvivalencia adatai.

    Raises:
        HTTPException: Ha az ekvivalencia nem található.
    """
    service = CourseEquivalenceService(db)
    eq = service.get_by_id(eq_id)
    if not eq:
        raise HTTPException(status_code=404, detail="CourseEquivalence not found")
    return eq

@router.post("", response_model=schemas.CourseEquivalence, dependencies=[Depends(admin_required)])
def create_course_equivalence(eq: schemas.CourseEquivalenceCreate, db: Session = Depends(get_db)):
    """
    Új kurzus ekvivalencia létrehozása.

    Args:
        eq (schemas.CourseEquivalenceCreate): Ekvivalencia adatai.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.CourseEquivalence: Létrehozott ekvivalencia.
    """
    service = CourseEquivalenceService(db)
    try:
        return service.create(eq)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{eq_id}", response_model=schemas.CourseEquivalence, dependencies=[Depends(admin_required)])
def update_course_equivalence(eq_id: int, eq: schemas.CourseEquivalenceBase, db: Session = Depends(get_db)):
    """
    Ekvivalencia frissítése.

    Args:
        eq_id (int): Ekvivalencia azonosító.
        eq (schemas.CourseEquivalenceBase): Friss adatok.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.CourseEquivalence: Frissített ekvivalencia.

    Raises:
        HTTPException: Ha az ekvivalencia nem található.
    """
    service = CourseEquivalenceService(db)
    try:
        updated = service.update(eq_id, eq)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not updated:
        raise HTTPException(status_code=404, detail="CourseEquivalence not found")
    return updated

@router.delete("/{eq_id}", response_model=schemas.CourseEquivalence, dependencies=[Depends(admin_required)])
def delete_course_equivalence(eq_id: int, db: Session = Depends(get_db)):
    """
    Ekvivalencia törlése.

    Args:
        eq_id (int): Ekvivalencia azonosító.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.CourseEquivalence: Törölt ekvivalencia.

    Raises:
        HTTPException: Ha az ekvivalencia nem található.
    """
    service = CourseEquivalenceService(db)
    deleted = service.delete(eq_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="CourseEquivalence not found")
