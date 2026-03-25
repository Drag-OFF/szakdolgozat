from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import schemas
from app.db.database import get_db
from app.services.course_major_service import CourseMajorService
from app.utils.utils import get_current_user, admin_required

router = APIRouter()


@router.get("", response_model=List[schemas.CourseMajor], summary="Kurzus–szak kapcsolatok listázása", description="Visszaadja a kurzus–szak kapcsolatokat. Csak bejelentkezett felhasználók érhetik el.")
def list_course_majors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user = Depends(get_current_user)):
    svc = CourseMajorService(db)
    # Service-ben a metódus neve get_all
    return svc.get_all(skip=skip, limit=limit)


@router.get("/{cm_id}", response_model=schemas.CourseMajor, summary="Kurzus–szak kapcsolat lekérése", description="Egy kapcsolat lekérése azonosító alapján (védett).")
def get_course_major(cm_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    svc = CourseMajorService(db)
    item = svc.get(cm_id)
    if not item:
        raise HTTPException(status_code=404, detail="CourseMajor not found")
    return item


@router.post("", response_model=schemas.CourseMajor, summary="Kapcsolat létrehozása", description="Új kurzus–szak kapcsolat létrehozása. Csak admin jogosultság.")
def create_course_major(payload: schemas.CourseMajorCreate, db: Session = Depends(get_db), admin = Depends(admin_required)):
    svc = CourseMajorService(db)
    try:
        return svc.create(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{cm_id}", response_model=schemas.CourseMajor, summary="Kapcsolat frissítése", description="Kapcsolat módosítása. Csak admin jogosultság.")
def update_course_major(cm_id: int, payload: schemas.CourseMajorUpdate, db: Session = Depends(get_db), admin = Depends(admin_required)):
    svc = CourseMajorService(db)
    updated = svc.update(cm_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="CourseMajor not found")
    return updated


@router.delete("/{cm_id}", response_model=dict, summary="Kapcsolat törlése", description="Kapcsolat törlése. Csak admin jogosultság.")
def delete_course_major(cm_id: int, db: Session = Depends(get_db), admin = Depends(admin_required)):
    svc = CourseMajorService(db)
    ok = svc.delete(cm_id)
    if not ok:
        raise HTTPException(status_code=404, detail="CourseMajor not found")
    return {"detail": "Deleted"}
