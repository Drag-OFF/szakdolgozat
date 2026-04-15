"""
Előrehaladás (progress) API: CRUD, követelmények összegzés, XLSX sablon/export/import.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import schemas, models
from app.db.database import get_db
from app.services.progress_service import ProgressService
from app.utils.utils import get_current_user
from app.utils.translations import EXPORT_HEADER, STATUS_MAP, CATEGORY_MAP, TEMPLATE_HEADER
from app.services.progress_export import export_progress_xlsx, generate_progress_template_xlsx
from app.services.requirements_service import get_user_requirements
from app.services.progress_service import ProgressService
from app.services.progress_import import ProgressImportService

import csv
import io
import openpyxl

router = APIRouter()

@router.post("/", response_model=schemas.Progress, dependencies=[Depends(get_current_user)])
def create_progress(progress: schemas.ProgressCreate, db: Session = Depends(get_db)):
    """
    Haladás létrehozása.

    Paraméterek:
        progress (schemas.ProgressCreate): A létrehozandó haladás adatai.
        db (Session): Az adatbázis kapcsolat.

    Visszatérés:
        schemas.Progress: A létrehozott haladás.

    Raises:
        HTTPException: Ha a haladás nem hozható létre.
    """
    progress_service = ProgressService(db)
    try:
        return progress_service.create_progress(progress)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[schemas.Progress], dependencies=[Depends(get_current_user)])
def get_progress(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Haladások lekérése.

    Paraméterek:
        skip (int): A kihagyandó haladások száma.
        limit (int): A visszaadandó haladások maximális száma.
        db (Session): Az adatbázis kapcsolat.

    Visszatérés:
        list[schemas.Progress]: A haladások listája.
    """
    progress_service = ProgressService(db)
    return progress_service.get_progress(skip=skip, limit=limit)

@router.get("/{user_id}", response_model=list[schemas.Progress])
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """
    Egy adott felhasználó haladásának lekérése.

    Paraméterek:
        user_id (int): A felhasználó azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Visszatérés:
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

    Paraméterek:
        progress_id (int): A frissítendő haladás azonosítója.
        progress (schemas.ProgressUpdate): A frissítendő haladás adatai.
        db (Session): Az adatbázis kapcsolat.

    Visszatérés:
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

    Paraméterek:
        progress_id (int): A törlendő haladás azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Visszatérés:
        dict: A törlés sikerességéről szóló üzenet.

    Raises:
        HTTPException: Ha a haladás nem található vagy nem törölhető.
    """
    progress_service = ProgressService(db)
    success = progress_service.delete_progress(progress_id)
    if not success:
        raise HTTPException(status_code=404, detail="Progress not found")
    return {"detail": "Progress deleted successfully"}

@router.get("/{user_id}/completed", response_model=list[schemas.Progress], dependencies=[Depends(get_current_user)])
def get_user_completed_courses(user_id: int, db: Session = Depends(get_db)):
    """
    Egy adott felhasználó teljesített kurzusainak lekérése.

    Paraméterek:
        user_id (int): A felhasználó azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Visszatérés:
        list[schemas.Progress]: A felhasználó összes 'completed' státuszú kurzusa.

    Raises:
        HTTPException: Ha a lekérdezés sikertelen.
    """
    progress_service = ProgressService(db)
    return progress_service.get_user_completed_courses(user_id)

@router.get("/{user_id}/in-progress", response_model=list[schemas.Progress], dependencies=[Depends(get_current_user)])
def get_user_in_progress_courses(user_id: int, db: Session = Depends(get_db)):
    """
    Egy adott felhasználó folyamatban lévő kurzusainak lekérése.

    Paraméterek:
        user_id (int): A felhasználó azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Visszatérés:
        list[schemas.Progress]: A felhasználó összes 'in_progress' státuszú kurzusa.

    Raises:
        HTTPException: Ha a lekérdezés sikertelen.
    """
    progress_service = ProgressService(db)
    return progress_service.get_user_in_progress_courses(user_id)

@router.get("/{user_id}/full", response_model=list[schemas.ProgressFull], dependencies=[Depends(get_current_user)])
def get_user_progress_full(user_id: int, lang: str = "hu", db: Session = Depends(get_db)):
    """
    Egy felhasználó összes haladását adja vissza, minden kapcsolódó kurzus, szak, ajánlott félév, kredit adattal együtt.
    """
    results = (
        db.query(
            models.Progress,
            models.Course,
            models.CourseMajor
        )
        .join(models.Course, models.Progress.course_id == models.Course.id)
        .join(models.User, models.Progress.user_id == models.User.id)
        .join(models.Major, models.User.major == models.Major.name)
        .join(models.CourseMajor, (models.CourseMajor.course_id == models.Course.id) & (models.CourseMajor.major_id == models.Major.id))
        .filter(models.Progress.user_id == user_id)
        .all()
    )
    return [
        schemas.ProgressFull(
            id=p.Progress.id,
            course_code=p.Course.course_code,
            course_name=p.Course.name_en if lang == "en" and p.Course.name_en else p.Course.name,
            recommended_semester=p.CourseMajor.semester,
            credit=p.CourseMajor.credit,
            completed_semester=p.Progress.completed_semester,
            status=STATUS_MAP[lang].get(p.Progress.status, p.Progress.status),
            points=p.Progress.points,
            category=CATEGORY_MAP[lang].get(getattr(p.CourseMajor, "type", None), getattr(p.CourseMajor, "type", None))
        )
        for p in results
    ]

@router.get("/{user_id}/requirements")
def requirements_endpoint(
    user_id: int,
    lang: str = "hu",
    db: Session = Depends(get_db)
):
    """
    Egy felhasználó szakos követelményeinek, teljesített és hiányzó kreditjeinek, elérhető kurzusainak lekérdezése.

    Paraméterek:
        user_id (int): A felhasználó azonosítója.
        lang (str): Nyelv ('hu' vagy 'en').
        db (Session): SQLAlchemy adatbázis kapcsolat.

    Visszatérés:
        dict: A követelmények, teljesített kreditek, elérhető kurzusok, stb.
    """
    return get_user_requirements(user_id, lang, db)

logger = logging.getLogger(__name__)

@router.get("/{user_id}/template-xlsx")
def template_xlsx(
    user_id: int,
    request: Request,
    lang: str = "hu",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Szakhoz tartozó összes tárgyat tartalmazó XLSX sablon generálása.

    Jogosultság: admin bármely ``user_id``-hoz; hallgató csak saját magához. A JWT ``current_user`` lehet dict vagy objektum;
    szerepkör ``role`` vagy ``roles`` mezőben (string vagy lista).
    """
    logger.debug("template_xlsx called; request.headers: %s", {k:v for k,v in request.headers.items()})
    logger.debug("template_xlsx called; current_user: %r", current_user)

    current_role = None
    current_id = -1
    try:
        if isinstance(current_user, dict):
            current_role = current_user.get("role") or current_user.get("roles")
            current_id = int(current_user.get("id") or current_user.get("user_id") or -1)
        else:
            current_role = getattr(current_user, "role", None) or getattr(current_user, "roles", None)
            current_id = int(getattr(current_user, "id", getattr(current_user, "user_id", -1)))
    except Exception as e:
        logger.exception("Error parsing current_user: %s", e)
        current_id = -1

    def is_admin(role_val) -> bool:
        if role_val is None:
            return False
        if isinstance(role_val, (list, tuple, set)):
            return any(str(r).lower() == "admin" or "admin" in str(r).lower() for r in role_val)
        s = str(role_val).lower()
        return s == "admin" or "admin" in s

    allowed = is_admin(current_role) or int(user_id) == int(current_id)
    logger.debug("template_xlsx auth check: current_id=%s current_role=%s allowed=%s", current_id, repr(current_role), allowed)

    if not allowed:
        raise HTTPException(status_code=403, detail="Nincs jogosultságod más felhasználó sablonjához.")

    return generate_progress_template_xlsx(user_id, lang, db, current_user)

@router.get("/{user_id}/export-xlsx")
def export_xlsx(
    user_id: int,
    lang: str = "hu",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    A felhasználó előrehaladásának exportja Excel (XLSX) formátumban.
    """
    return export_progress_xlsx(user_id, lang, db, current_user)

@router.post("/{user_id}/import", dependencies=[Depends(get_current_user)])
async def import_progress(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Felhasználó előrehaladásának importálása XLSX-ből.
    """
    import_service = ProgressImportService(db)
    return await import_service.import_progress(user_id, file)
