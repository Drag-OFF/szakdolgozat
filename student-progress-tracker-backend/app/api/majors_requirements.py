from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import schemas
from app.db.database import get_db
from app.services.majors_requirements_service import MajorsRequirementsService
from app.utils.utils import get_current_user

router = APIRouter()

@router.get("/", response_model=list[schemas.MajorRequirement], dependencies=[Depends(get_current_user)])
def get_major_requirements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Szak követelmények lekérdezése.

    Args:
        skip (int): Hány rekordot hagyjon ki.
        limit (int): Hány rekordot adjon vissza.
        db (Session): Adatbázis kapcsolat.

    Returns:
        list[schemas.MajorRequirement]: Követelmények listája.
    """
    service = MajorsRequirementsService(db)
    return service.get_all(skip, limit)

@router.get("/{req_id}", response_model=schemas.MajorRequirement, dependencies=[Depends(get_current_user)])
def get_major_requirement(req_id: int, db: Session = Depends(get_db)):
    """
    Egy követelmény lekérdezése azonosító alapján.

    Args:
        req_id (int): Követelmény azonosító.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.MajorRequirement: Követelmény adatai.

    Raises:
        HTTPException: Ha a követelmény nem található.
    """
    service = MajorsRequirementsService(db)
    req = service.get_by_id(req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Major requirement not found")
    return req

@router.post("/", response_model=schemas.MajorRequirement, dependencies=[Depends(get_current_user)])
def create_major_requirement(req: schemas.MajorRequirementCreate, db: Session = Depends(get_db)):
    """
    Új követelmény létrehozása.

    Args:
        req (schemas.MajorRequirementCreate): Követelmény adatai.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.MajorRequirement: Létrehozott követelmény.
    """
    service = MajorsRequirementsService(db)
    return service.create(req)

@router.put("/{req_id}", response_model=schemas.MajorRequirement, dependencies=[Depends(get_current_user)])
def update_major_requirement(req_id: int, req: schemas.MajorRequirementBase, db: Session = Depends(get_db)):
    """
    Követelmény frissítése.

    Args:
        req_id (int): Követelmény azonosító.
        req (schemas.MajorRequirementBase): Friss adatok.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.MajorRequirement: Frissített követelmény.

    Raises:
        HTTPException: Ha a követelmény nem található.
    """
    service = MajorsRequirementsService(db)
    updated = service.update(req_id, req)
    if not updated:
        raise HTTPException(status_code=404, detail="Major requirement not found")
    return updated

@router.delete("/{req_id}", response_model=schemas.MajorRequirement, dependencies=[Depends(get_current_user)])
def delete_major_requirement(req_id: int, db: Session = Depends(get_db)):
    """
    Követelmény törlése.

    Args:
        req_id (int): Követelmény azonosító.
        db (Session): Adatbázis kapcsolat.

    Returns:
        schemas.MajorRequirement: Törölt követelmény.

    Raises:
        HTTPException: Ha a követelmény nem található.
    """
    service = MajorsRequirementsService(db)
    deleted = service.delete(req_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Major requirement not found")
    return deleted