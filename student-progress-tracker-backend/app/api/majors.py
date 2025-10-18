from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import schemas
from app.db.database import get_db
from app.services.majors_service import MajorsService
from app.utils.utils import get_current_user

router = APIRouter()

@router.get("/", response_model=list[schemas.Major], dependencies=[Depends(get_current_user)])
def get_majors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Szakok lekérdezése.

    Args:
        skip (int): Hány rekordot hagyjon ki.
        limit (int): Hány rekordot adjon vissza.
        db (Session): Adatbázis kapcsolat.

    Returns:
        list[schemas.Major]: Szakok listája.
    """
    service = MajorsService(db)
    return service.get_majors(skip, limit)

@router.get("/{major_id}", response_model=schemas.Major, dependencies=[Depends(get_current_user)])
def get_major(major_id: int, db: Session = Depends(get_db)):
    """
    Egy szak lekérdezése azonosító alapján.

    Args:
        major_id (int): Szak azonosító.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.Major: Szak adatai.

    Raises:
        HTTPException: Ha a szak nem található.
    """
    service = MajorsService(db)
    major = service.get_major(major_id)
    if not major:
        raise HTTPException(status_code=404, detail="Major not found")
    return major

@router.post("/", response_model=schemas.Major, dependencies=[Depends(get_current_user)])
def create_major(major: schemas.MajorCreate, db: Session = Depends(get_db)):
    """
    Új szak létrehozása.

    Args:
        major (schemas.MajorCreate): Szak adatai.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.Major: Létrehozott szak.
    """
    service = MajorsService(db)
    return service.create_major(major)

@router.put("/{major_id}", response_model=schemas.Major, dependencies=[Depends(get_current_user)])
def update_major(major_id: int, major: schemas.MajorBase, db: Session = Depends(get_db)):
    """
    Szak adatainak frissítése.

    Args:
        major_id (int): Szak azonosító.
        major (schemas.MajorBase): Friss adatok.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.Major: Frissített szak.

    Raises:
        HTTPException: Ha a szak nem található.
    """
    service = MajorsService(db)
    updated = service.update_major(major_id, major)
    if not updated:
        raise HTTPException(status_code=404, detail="Major not found")
    return updated

@router.delete("/{major_id}", response_model=schemas.Major, dependencies=[Depends(get_current_user)])
def delete_major(major_id: int, db: Session = Depends(get_db)):
    """
    Szak törlése.

    Args:
        major_id (int): Szak azonosító.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.Major: Törölt szak.

    Raises:
        HTTPException: Ha a szak nem található.
    """
    service = MajorsService(db)
    deleted = service.delete_major(major_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Major not found")
    return deleted