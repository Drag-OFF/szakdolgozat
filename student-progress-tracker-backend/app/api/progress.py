from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db import models, schemas
from app.db.database import get_db
from app.services.progress_service import ProgressService

router = APIRouter()

@router.post("/", response_model=schemas.Progress)
def create_progress(progress: schemas.ProgressCreate, db: Session = Depends(get_db)):
    """
    Haladás létrehozása.

    Args:
        progress (schemas.ProgressCreate): A létrehozandó haladás adatai.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.Progress: A létrehozott haladás.

    Raises:
        HTTPException: Ha a haladás nem hozható létre.
    """
    progress_service = ProgressService(db)
    try:
        return progress_service.create_progress(progress)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[schemas.Progress])
def get_progress(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Haladások lekérése.

    Args:
        skip (int): A kihagyandó haladások száma.
        limit (int): A visszaadandó haladások maximális száma.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        list[schemas.Progress]: A haladások listája.
    """
    progress_service = ProgressService(db)
    return progress_service.get_progress(skip=skip, limit=limit)

@router.get("/{user_id}", response_model=list[schemas.Progress])
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """
    Egy adott felhasználó haladásának lekérése.

    Args:
        user_id (int): A felhasználó azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        list[schemas.Progress]: A felhasználó haladásának listája.

    Raises:
        HTTPException: Ha a felhasználó haladása nem található.
    """
    progress_service = ProgressService(db)
    user_progress = progress_service.get_user_progress(user_id)
    if user_progress is None:
        raise HTTPException(status_code=404, detail="User progress not found")
    return user_progress

@router.put("/{progress_id}", response_model=schemas.Progress)
def update_progress(progress_id: int, progress: schemas.ProgressUpdate, db: Session = Depends(get_db)):
    """
    Haladás frissítése.

    Args:
        progress_id (int): A frissítendő haladás azonosítója.
        progress (schemas.ProgressUpdate): A frissítendő haladás adatai.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.Progress: A frissített haladás.

    Raises:
        HTTPException: Ha a haladás nem található vagy nem frissíthető.
    """
    progress_service = ProgressService(db)
    updated_progress = progress_service.update_progress(progress_id, progress)
    if updated_progress is None:
        raise HTTPException(status_code=404, detail="Progress not found")
    return updated_progress

@router.delete("/{progress_id}", response_model=dict)
def delete_progress(progress_id: int, db: Session = Depends(get_db)):
    """
    Haladás törlése.

    Args:
        progress_id (int): A törlendő haladás azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        dict: A törlés sikerességéről szóló üzenet.

    Raises:
        HTTPException: Ha a haladás nem található vagy nem törölhető.
    """
    progress_service = ProgressService(db)
    success = progress_service.delete_progress(progress_id)
    if not success:
        raise HTTPException(status_code=404, detail="Progress not found")
    return {"detail": "Progress deleted successfully"}