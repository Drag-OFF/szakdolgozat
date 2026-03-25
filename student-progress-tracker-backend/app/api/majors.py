from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import schemas
from app.db.database import get_db
from app.services.majors_service import MajorsService
from app.utils.utils import admin_required

router = APIRouter()


@router.get("", response_model=List[schemas.Major], summary="Szakok listázása", description="Visszaadja a szakok listáját.")
def list_majors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = MajorsService(db)
    # Service-ben a metódus neve get_majors
    return service.get_majors(skip=skip, limit=limit)


@router.get("/{major_id}", response_model=schemas.Major, summary="Szak lekérése", description="Egy szak részleteinek lekérése azonosító alapján.")
def get_major(major_id: int, db: Session = Depends(get_db)):
    service = MajorsService(db)
    item = service.get_major(major_id)
    if not item:
        raise HTTPException(status_code=404, detail="Major not found")
    return item


@router.post("", response_model=schemas.Major, summary="Szak létrehozása", description="Új szak létrehozása. Csak admin jogosultság.")
def create_major(payload: schemas.MajorCreate, db: Session = Depends(get_db), admin = Depends(admin_required)):
    service = MajorsService(db)
    try:
        return service.create_major(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{major_id}", response_model=schemas.Major, summary="Szak frissítése", description="Szak adatainak módosítása. Csak admin jogosultság.")
def update_major(major_id: int, payload: schemas.MajorUpdate, db: Session = Depends(get_db), admin = Depends(admin_required)):
    service = MajorsService(db)
    updated = service.update_major(major_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Major not found")
    return updated


@router.delete("/{major_id}", response_model=dict, summary="Szak törlése", description="Szak törlése az ID alapján. Csak admin jogosultság.")
def delete_major(major_id: int, db: Session = Depends(get_db), admin = Depends(admin_required)):
    service = MajorsService(db)
    ok = service.delete_major(major_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Major not found")
    return {"detail": "Deleted"}
