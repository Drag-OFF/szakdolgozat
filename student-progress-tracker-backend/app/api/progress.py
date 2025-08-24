from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import schemas, models
from app.db.database import get_db
from app.services.progress_service import ProgressService
from app.utils import get_current_user
import csv
import io
import openpyxl

router = APIRouter()

@router.post("/", response_model=schemas.Progress, dependencies=[Depends(get_current_user)])
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

@router.get("/", response_model=list[schemas.Progress], dependencies=[Depends(get_current_user)])
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



@router.get("/{user_id}/completed", response_model=list[schemas.Progress], dependencies=[Depends(get_current_user)])
def get_user_completed_courses(user_id: int, db: Session = Depends(get_db)):
    """
    Egy adott felhasználó teljesített kurzusainak lekérése.

    Args:
        user_id (int): A felhasználó azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Returns:
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

    Args:
        user_id (int): A felhasználó azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        list[schemas.Progress]: A felhasználó összes 'in_progress' státuszú kurzusa.

    Raises:
        HTTPException: Ha a lekérdezés sikertelen.
    """
    progress_service = ProgressService(db)
    return progress_service.get_user_in_progress_courses(user_id)


@router.get("/{user_id}/full", response_model=list[schemas.ProgressFull], dependencies=[Depends(get_current_user)])
def get_user_progress_full(user_id: int, db: Session = Depends(get_db)):
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
            course_name=p.Course.name,
            recommended_semester=p.CourseMajor.semester,
            credit=p.CourseMajor.credit,
            completed_semester=p.Progress.completed_semester,
            status=p.Progress.status,
            points=p.Progress.points,
            category=getattr(p.CourseMajor, "type", None)  # vagy "category" ha így hívod
        )
        for p in results
    ]

@router.get("/{user_id}/requirements")
def get_requirements(user_id: int, db: Session = Depends(get_db)):
    user = db.execute(text("SELECT major FROM users WHERE id = :uid"), {"uid": user_id}).fetchone()
    major = user.major
    major_id = db.execute(text("SELECT id FROM majors WHERE name = :major"), {"major": major}).scalar()
    req = db.execute(text("SELECT * FROM major_requirements WHERE major_id = :mid"), {"mid": major_id}).fetchone()

    # Ekvivalens kurzuscsoportok
    def get_equivalents(course_id):
        rows = db.execute(text("""
            SELECT equivalent_course_id FROM course_equivalence WHERE course_id = :cid
            UNION
            SELECT course_id FROM course_equivalence WHERE equivalent_course_id = :cid
        """), {"cid": course_id}).fetchall()
        return set([course_id] + [r[0] for r in rows])

    completed_courses = set(
        row[0] for row in db.execute(text("""
            SELECT course_id FROM progress
            WHERE user_id = :uid AND status = 'completed'
        """), {"uid": user_id}).fetchall()
    )

    def is_group_completed(course_ids):
        return any(cid in completed_courses for cid in course_ids)

    def get_group_credit(course_ids, type_, subgroup=None):
        for cid in course_ids:
            sql = "SELECT credit FROM course_major WHERE course_id = :cid AND major_id = :mid AND type = :type"
            params = {"cid": cid, "mid": major_id, "type": type_}
            if subgroup:
                sql += " AND subgroup = :sg"
                params["sg"] = subgroup
            credit = db.execute(text(sql), params).scalar()
            if credit:
                return credit
        return 0

    def get_credits_with_equiv(type_, subgroup=None, exclude_subgroup=None):
        sql = """
            SELECT cm.course_id
            FROM course_major cm
            WHERE cm.major_id = :mid AND cm.type = :type
        """
        params = {"mid": major_id, "type": type_}
        if subgroup == "elective_non_core_credits":
            sql += " AND cm.subgroup IS NULL"
        elif subgroup:
            sql += " AND cm.subgroup = :sg"
            params["sg"] = subgroup
        if exclude_subgroup:
            sql += " AND (cm.subgroup IS NULL OR cm.subgroup != :exsg)"
            params["exsg"] = exclude_subgroup
        course_ids = [row[0] for row in db.execute(text(sql), params).fetchall()]
        seen = set()
        total = 0
        for cid in course_ids:
            group = get_equivalents(cid)
            group_key = tuple(sorted(group))
            if group_key in seen:
                continue
            seen.add(group_key)
            if is_group_completed(group):
                total += get_group_credit(group, type_, subgroup)
        return total

    # Követelmények (szakmai gyakorlat kizárva)
    required = get_credits_with_equiv('required', exclude_subgroup='practice_hours')

    def get_available_with_equiv(type_, subgroup=None, name_like=None):
        sql = """
            SELECT cm.course_id, c.course_code, c.name, cm.semester, cm.credit
            FROM course_major cm
            JOIN courses c ON cm.course_id = c.id
            WHERE cm.major_id = :mid AND cm.type = :type
        """
        params = {"mid": major_id, "type": type_}
        if subgroup == "elective_non_core_credits":
            sql += " AND cm.subgroup IS NULL"
        elif subgroup:
            sql += " AND cm.subgroup = :sg"
            params["sg"] = subgroup
        if name_like:
            sql += " AND c.name LIKE :name_like"
            params["name_like"] = name_like
        rows = db.execute(text(sql), params).fetchall()
        available = []
        seen = set()
        for row in rows:
            group = get_equivalents(row[0])
            group_key = tuple(sorted(group))
            if group_key in seen:
                continue
            seen.add(group_key)
            if not is_group_completed(group):
                available.append({
                    "course_code": row[1],
                    "name": row[2],
                    "semester": row[3],
                    "credit": row[4]
                })
        return available

    # Szakdolgozatok kezelése
    def get_available_thesis(thesis_code, thesis_name):
        sql = """
            SELECT cm.course_id, c.course_code, c.name, cm.semester, cm.credit
            FROM course_major cm
            JOIN courses c ON cm.course_id = c.id
            WHERE cm.major_id = :mid AND cm.type = 'required' AND cm.subgroup IS NULL
            AND (c.course_code = :thesis_code OR c.name = :thesis_name)
        """
        params = {
            "mid": major_id,
            "thesis_code": thesis_code,
            "thesis_name": thesis_name
        }
        rows = db.execute(text(sql), params).fetchall()
        available = []
        seen = set()
        for row in rows:
            group = get_equivalents(row[0])
            group_key = tuple(sorted(group))
            if group_key in seen:
                continue
            seen.add(group_key)
            if not is_group_completed(group):
                available.append({
                    "course_code": row[1],
                    "name": row[2],
                    "semester": row[3],
                    "credit": row[4]
                })
        return available

    thesis1_completed = db.execute(text("""
        SELECT COUNT(*) FROM progress p
        JOIN course_major cm ON cm.course_id = p.course_id
        WHERE cm.major_id = :mid AND p.user_id = :uid AND p.status = 'completed'
          AND (p.course_id IN (
                SELECT id FROM courses WHERE name LIKE '%Szakdolgozat 1%' OR course_code LIKE '%970%'
          ))
    """), {"mid": major_id, "uid": user_id}).scalar() > 0

    thesis2_completed = db.execute(text("""
        SELECT COUNT(*) FROM progress p
        JOIN course_major cm ON cm.course_id = p.course_id
        WHERE cm.major_id = :mid AND p.user_id = :uid AND p.status = 'completed'
          AND (p.course_id IN (
                SELECT id FROM courses WHERE name LIKE '%Szakdolgozat 2%' OR course_code LIKE '%975%'
          ))
    """), {"mid": major_id, "uid": user_id}).scalar() > 0

    available_thesis1 = get_available_thesis("IB970", "Szakdolgozat készítése 1. (gi)")
    available_thesis2 = get_available_thesis("IB975", "Szakdolgozat készítése 2. (gi)")

    # Szakmai gyakorlat teljesített órák lekérése
    practice_course_ids = [
        row[0] for row in db.execute(text("""
            SELECT cm.course_id
            FROM course_major cm
            WHERE cm.major_id = :mid AND cm.subgroup = 'practice_hours'
        """), {"mid": major_id}).fetchall()
    ]

    # Teljesített órák (completed + in_progress)
    practice_completed_hours = db.execute(text("""
        SELECT COALESCE(SUM(p.completed_semester), 0)
        FROM progress p
        WHERE p.user_id = :uid AND p.status IN ('completed', 'in_progress') AND p.course_id IN :practice_ids
    """), {"uid": user_id, "practice_ids": tuple(practice_course_ids)}).scalar()

    practice_required_hours = req.practice_hours or 0
    practice_missing_hours = max(0, practice_required_hours - (practice_completed_hours or 0))

    # Elérhető gyakorlat kurzusok (csak ha nincs felvéve)
    taken_practice_courses = set(
        row[0] for row in db.execute(text("""
            SELECT course_id FROM progress
            WHERE user_id = :uid AND status IN ('completed', 'in_progress')
        """), {"uid": user_id}).fetchall()
    )

    available_practice = [
        {
            "course_code": row[1],
            "name": row[2],
            "semester": row[3],
            "credit": row[4]
        }
        for row in db.execute(text("""
            SELECT cm.course_id, c.course_code, c.name, cm.semester, cm.credit
            FROM course_major cm
            JOIN courses c ON cm.course_id = c.id
            WHERE cm.major_id = :mid AND cm.subgroup = 'practice_hours'
        """), {"mid": major_id}).fetchall()
        if row[0] not in taken_practice_courses
    ]

    # Követelmények
    available_required = get_available_with_equiv('required')
    core = get_credits_with_equiv('elective', 'elective_core_credits')
    info = get_credits_with_equiv('elective', 'elective_info_credits')
    non_core = get_credits_with_equiv('elective', 'elective_non_core_credits')
    available_core = get_available_with_equiv('elective', 'elective_core_credits')
    available_info = get_available_with_equiv('elective', 'elective_info_credits')
    available_non_core = get_available_with_equiv('elective', 'elective_non_core_credits')
    optional = get_credits_with_equiv('optional')
    available_optional = get_available_with_equiv('optional')
    pe_semesters = db.execute(text("""
        SELECT COUNT(DISTINCT p.course_id)
        FROM course_major cm
        JOIN progress p ON cm.course_id = p.course_id
        WHERE cm.major_id = :mid AND (cm.type = 'pe' OR cm.subgroup = 'pe')
          AND p.user_id = :uid AND p.status = 'completed'
    """), {"mid": major_id, "uid": user_id}).scalar()



    taken_pe_courses = set(
        row[0] for row in db.execute(text("""
            SELECT course_id FROM progress
            WHERE user_id = :uid AND status IN ('completed', 'in_progress')
        """), {"uid": user_id}).fetchall()
    )
    available_pe = [
        {
            "course_code": row[1],
            "name": row[2],
            "semester": row[3],
            "credit": row[4]
        }
        for row in db.execute(text("""
            SELECT cm.course_id, c.course_code, c.name, cm.semester, cm.credit
            FROM course_major cm
            JOIN courses c ON cm.course_id = c.id
            WHERE cm.major_id = :mid AND cm.subgroup = 'pe'
        """), {"mid": major_id}).fetchall()
        if row[0] not in taken_pe_courses
    ]

    total_credits = (required or 0) + (core or 0) + (non_core or 0) + (optional or 0)

    return {
        "total_credits": {
            "completed": total_credits or 0,
            "required": req.total_credits,
            "missing": max(0, req.total_credits - (total_credits or 0))
        },
        "required_credits": {
            "completed": required or 0,
            "required": req.required_credits,
            "missing": max(0, req.required_credits - (required or 0)),
            "available_courses": available_required
        },
        "elective_credits": {
            "completed": (core or 0) + (non_core or 0),
            "required": req.elective_credits,
            "missing": max(0, req.elective_credits - ((core or 0) + (non_core or 0))),
            "core": {
                "completed": core or 0,
                "required": req.elective_core_credits,
                "missing": max(0, req.elective_core_credits - (core or 0)),
                "available_courses": available_core,
                "info_core": {
                    "completed": info or 0,
                    "required": req.elective_info_credits,
                    "missing": max(0, req.elective_info_credits - (info or 0)),
                    "available_courses": available_info
                }
            },
            "non_core": {
                "completed": non_core or 0,
                "required": req.elective_non_core_credits,
                "missing": max(0, req.elective_non_core_credits - (non_core or 0)),
                "available_courses": available_non_core
            }
        },
        "optional_credits": {
            "completed": optional or 0,
            "required": req.optional_credits,
            "missing": max(0, req.optional_credits - (optional or 0)),
            "available_courses": available_optional
        },
        "pe_semesters": {
            "completed": pe_semesters or 0,
            "required": req.pe_semesters,
            "missing": max(0, req.pe_semesters - (pe_semesters or 0)),
            "available_courses": available_pe
        },
        "practice_hours": {
            "completed": practice_completed_hours or 0,
            "required": practice_required_hours,
            "missing": practice_missing_hours,
            "available_courses": available_practice
        },
        "thesis1_completed": thesis1_completed,
        "thesis2_completed": thesis2_completed,
        "available_thesis1": available_thesis1,
        "available_thesis2": available_thesis2
    }

@router.get("/{user_id}/export-xlsx")
def export_progress_xlsx(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    A felhasználó előrehaladásának exportja Excel (XLSX) formátumban.
    Csak a saját adatait töltheti le!
    """
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Nincs jogosultságod más felhasználó adatainak letöltéséhez.")

    progress_service = ProgressService(db)
    header = [
        "Kurzus kód",
        "Kurzus neve",
        "Kredit",
        "Státusz",
        "Teljesítés féléve",
        "Pontszám",
        "Kategória"
    ]
    rows = progress_service.get_user_progress_export_rows(user_id)

    import openpyxl
    import io

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Előrehaladás"
    ws.append(header)
    for row in rows:
        ws.append(row)
    # Opcionális: oszlop szélesség automatikus beállítása
    for col in ws.columns:
        max_length = 0
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except Exception:
                pass
        ws.column_dimensions[col_letter].width = max_length + 2

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=progress_{user_id}.xlsx"}
    )

@router.get("/{user_id}/template-xlsx")
def generate_progress_template_xlsx(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Szakhoz tartozó összes tárgyat tartalmazó XLSX sablon generálása.
    A felhasználó már teljesített vagy folyamatban lévő tárgyai előre kitöltve.
    """
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Nincs jogosultságod más felhasználó sablonjához.")

    # 1. Lekérjük a user szakját
    user_row = db.execute(text("SELECT major FROM users WHERE id = :uid"), {"uid": user_id}).fetchone()
    if not user_row:
        raise HTTPException(status_code=404, detail="Felhasználó nem található.")
    major = user_row.major

    # 2. Lekérjük a szakhoz tartozó összes tárgyat
    courses = db.execute(text("""
        SELECT c.id, c.course_code, c.name, cm.type, cm.semester, cm.credit
        FROM course_major cm
        JOIN courses c ON cm.course_id = c.id
        JOIN majors m ON cm.major_id = m.id
        WHERE m.name = :major
        ORDER BY cm.type, cm.semester, c.course_code
    """), {"major": major}).fetchall()

    # 3. Lekérjük a felhasználó progress adatait (status, completed_semester, points)
    progress = {
        row.course_id: row for row in db.execute(text("""
            SELECT course_id, status, completed_semester, points
            FROM progress
            WHERE user_id = :uid
        """), {"uid": user_id}).fetchall()
    }

    import openpyxl
    import io

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Előrehaladás sablon"
    header = [
        "Kurzus kód",
        "Kurzus neve",
        "Kategória",
        "Ajánlott félév",
        "Kredit",
        "Státusz (completed/in_progress)",
        "Teljesítés féléve",
        "Pontszám"
    ]
    ws.append(header)

    for c in courses:
        prog = progress.get(c.id)
        ws.append([
            c.course_code,
            c.name,
            c.type,
            c.semester,
            c.credit,
            prog.status if prog else "",
            prog.completed_semester if prog else "",
            prog.points if prog else ""
        ])

    # Opcionális: oszlop szélesség automatikus beállítása
    for col in ws.columns:
        max_length = 0
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except Exception:
                pass
        ws.column_dimensions[col_letter].width = max_length + 2

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=progress_template_{user_id}.xlsx"}
    )