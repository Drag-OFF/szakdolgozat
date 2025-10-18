"""
A szakos követelmények (requirements) számítási és lekérdezési logikája.
Ez a modul tartalmazza a felhasználó szakos követelményeinek, teljesített és hiányzó kreditjeinek,
elérhető kurzusainak kiszámításához szükséges segédfüggvényeket és a fő összesítő függvényt.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text

def get_major_and_requirements(user_id: int, db: Session):
    """
    Lekéri a felhasználó szakját és a szak követelményeit.

    Args:
        user_id (int): A felhasználó azonosítója.
        db (Session): SQLAlchemy adatbázis kapcsolat.

    Returns:
        tuple: (major neve, major_id, requirements rekord)
    """
    user = db.execute(text("SELECT major FROM users WHERE id = :uid"), {"uid": user_id}).fetchone()
    if not user:
        raise ValueError("Felhasználó nem található.")
    major = user.major
    major_id = db.execute(text("SELECT id FROM majors WHERE name = :major"), {"major": major}).scalar()
    req = db.execute(text("SELECT * FROM major_requirements WHERE major_id = :mid"), {"mid": major_id}).fetchone()
    return major, major_id, req

def get_equivalents(course_id: int, db: Session) -> set:
    """
    Visszaadja az adott kurzus ekvivalens kurzuscsoportját.

    Args:
        course_id (int): Kurzus azonosító.
        db (Session): SQLAlchemy adatbázis kapcsolat.

    Returns:
        set: Az ekvivalens kurzusok azonosítóinak halmaza.
    """
    rows = db.execute(text("""
        SELECT equivalent_course_id FROM course_equivalence WHERE course_id = :cid
        UNION
        SELECT course_id FROM course_equivalence WHERE equivalent_course_id = :cid
    """), {"cid": course_id}).fetchall()
    return set([course_id] + [r[0] for r in rows])

def get_completed_courses(user_id: int, db: Session) -> set:
    """
    Visszaadja a felhasználó által teljesített kurzusok azonosítóit.

    Args:
        user_id (int): A felhasználó azonosítója.
        db (Session): SQLAlchemy adatbázis kapcsolat.

    Returns:
        set: Teljesített kurzusok azonosítói.
    """
    return set(
        row[0] for row in db.execute(text("""
            SELECT course_id FROM progress
            WHERE user_id = :uid AND status = 'completed'
        """), {"uid": user_id}).fetchall()
    )

def is_group_completed(course_ids: set, completed_courses: set) -> bool:
    """
    Megmondja, hogy egy ekvivalens kurzuscsoportból legalább egy teljesítve van-e.

    Args:
        course_ids (set): Ekvivalens kurzusok azonosítói.
        completed_courses (set): Teljesített kurzusok azonosítói.

    Returns:
        bool: True, ha legalább egy teljesítve van.
    """
    return any(cid in completed_courses for cid in course_ids)

def get_group_credit(course_ids: set, type_: str, db: Session, major_id: int, subgroup=None) -> int:
    """
    Visszaadja egy ekvivalens kurzuscsoport kreditértékét.

    Args:
        course_ids (set): Ekvivalens kurzusok azonosítói.
        type_ (str): Kurzus típusa.
        db (Session): SQLAlchemy adatbázis kapcsolat.
        major_id (int): Szak azonosító.
        subgroup (str, optional): Alcsoport neve.

    Returns:
        int: Kreditérték.
    """
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

def get_credits_with_equiv(type_: str, db: Session, major_id: int, completed_courses: set, subgroup=None, exclude_subgroup=None) -> int:
    """
    Összesíti a teljesített krediteket egy típusra, ekvivalens kurzuscsoportokat figyelembe véve.

    Args:
        type_ (str): Kurzus típusa.
        db (Session): SQLAlchemy adatbázis kapcsolat.
        major_id (int): Szak azonosító.
        completed_courses (set): Teljesített kurzusok azonosítói.
        subgroup (str, optional): Alcsoport neve.
        exclude_subgroup (str, optional): Kizárt alcsoport.

    Returns:
        int: Teljesített kreditek száma.
    """
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
        group = get_equivalents(cid, db)
        group_key = tuple(sorted(group))
        if group_key in seen:
            continue
        seen.add(group_key)
        if is_group_completed(group, completed_courses):
            total += get_group_credit(group, type_, db, major_id, subgroup)
    return total

def get_available_with_equiv(type_: str, db: Session, major_id: int, completed_courses: set, lang: str, subgroup=None, name_like=None) -> list:
    """
    Lekérdezi az elérhető (még nem teljesített) kurzusokat egy típusra, ekvivalens csoportokat figyelembe véve.

    Args:
        type_ (str): Kurzus típusa.
        db (Session): SQLAlchemy adatbázis kapcsolat.
        major_id (int): Szak azonosító.
        completed_courses (set): Teljesített kurzusok azonosítói.
        lang (str): Nyelv ('hu' vagy 'en').
        subgroup (str, optional): Alcsoport neve.
        name_like (str, optional): Kurzusnév szűrés.

    Returns:
        list: Elérhető kurzusok listája.
    """
    sql = """
        SELECT cm.course_id, c.course_code, c.name, c.name_en, cm.semester, cm.credit
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
        group = get_equivalents(row[0], db)
        group_key = tuple(sorted(group))
        if group_key in seen:
            continue
        seen.add(group_key)
        if not is_group_completed(group, completed_courses):
            available.append({
                "course_code": row[1],
                "name": row[3] if lang == "en" else row[2],
                "semester": row[4],
                "credit": row[5]
            })
    return available

def get_available_thesis(thesis_code: str, thesis_name: str, db: Session, major_id: int, completed_courses: set, lang: str) -> list:
    """
    Lekérdezi az elérhető szakdolgozat kurzusokat.

    Args:
        thesis_code (str): Szakdolgozat kurzus kódja.
        thesis_name (str): Szakdolgozat kurzus neve.
        db (Session): SQLAlchemy adatbázis kapcsolat.
        major_id (int): Szak azonosító.
        completed_courses (set): Teljesített kurzusok azonosítói.
        lang (str): Nyelv ('hu' vagy 'en').

    Returns:
        list: Elérhető szakdolgozat kurzusok listája.
    """
    sql = """
        SELECT cm.course_id, c.course_code, c.name, c.name_en, cm.semester, cm.credit
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
        group = get_equivalents(row[0], db)
        group_key = tuple(sorted(group))
        if group_key in seen:
            continue
        seen.add(group_key)
        if not is_group_completed(group, completed_courses):
            available.append({
                "course_code": row[1],
                "name": row[3] if lang == "en" else row[2],
                "semester": row[4],
                "credit": row[5]
            })
    return available

def get_practice_hours(user_id: int, db: Session, major_id: int, req) -> tuple:
    """
    Lekérdezi a szakmai gyakorlat teljesített, szükséges és hiányzó óráit, valamint az elérhető gyakorlat kurzusokat.

    Args:
        user_id (int): A felhasználó azonosítója.
        db (Session): SQLAlchemy adatbázis kapcsolat.
        major_id (int): Szak azonosító.
        req: Követelmény rekord.

    Returns:
        tuple: (completed_hours, required_hours, missing_hours, available_practice)
    """
    practice_course_ids = [
        row[0] for row in db.execute(text("""
            SELECT cm.course_id
            FROM course_major cm
            WHERE cm.major_id = :mid AND cm.subgroup = 'practice_hours'
        """), {"mid": major_id}).fetchall()
    ]
    practice_completed_hours = db.execute(text("""
        SELECT COALESCE(SUM(p.completed_semester), 0)
        FROM progress p
        WHERE p.user_id = :uid AND p.status IN ('completed', 'in_progress') AND p.course_id IN :practice_ids
    """), {"uid": user_id, "practice_ids": tuple(practice_course_ids)}).scalar()
    practice_required_hours = req.practice_hours or 0
    practice_missing_hours = max(0, practice_required_hours - (practice_completed_hours or 0))
    taken_practice_courses = set(
        row[0] for row in db.execute(text("""
            SELECT course_id FROM progress
            WHERE user_id = :uid AND status IN ('completed', 'in_progress')
        """), {"uid": user_id}).fetchall()
    )
    available_practice = [
        {
            "course_code": row[1],
            "name": row[3],
            "semester": row[4],
            "credit": row[5]
        }
        for row in db.execute(text("""
            SELECT cm.course_id, c.course_code, c.name, c.name_en, cm.semester, cm.credit
            FROM course_major cm
            JOIN courses c ON cm.course_id = c.id
            WHERE cm.major_id = :mid AND cm.subgroup = 'practice_hours'
        """), {"mid": major_id}).fetchall()
        if row[0] not in taken_practice_courses
    ]
    return practice_completed_hours, practice_required_hours, practice_missing_hours, available_practice

def get_pe_semesters(user_id: int, db: Session, major_id: int) -> tuple:
    """
    Lekérdezi a teljesített testnevelés félévek számát és az elérhető testnevelés kurzusokat.

    Args:
        user_id (int): A felhasználó azonosítója.
        db (Session): SQLAlchemy adatbázis kapcsolat.
        major_id (int): Szak azonosító.

    Returns:
        tuple: (completed_pe_semesters, available_pe)
    """
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
            "name": row[3],
            "semester": row[4],
            "credit": row[5]
        }
        for row in db.execute(text("""
            SELECT cm.course_id, c.course_code, c.name, c.name_en, cm.semester, cm.credit
            FROM course_major cm
            JOIN courses c ON cm.course_id = c.id
            WHERE cm.major_id = :mid AND cm.subgroup = 'pe'
        """), {"mid": major_id}).fetchall()
        if row[0] not in taken_pe_courses
    ]
    return pe_semesters, available_pe

def get_user_requirements(user_id: int, lang: str, db: Session) -> dict:
    """
    Egy felhasználó szakos követelményeinek, teljesített és hiányzó kreditjeinek, elérhető kurzusainak kiszámítása.

    Args:
        user_id (int): A felhasználó azonosítója.
        lang (str): Nyelv ('hu' vagy 'en').
        db (Session): SQLAlchemy adatbázis kapcsolat.

    Returns:
        dict: A követelmények, teljesített kreditek, elérhető kurzusok, stb.
    """
    major, major_id, req = get_major_and_requirements(user_id, db)
    completed_courses = get_completed_courses(user_id, db)

    required = get_credits_with_equiv('required', db, major_id, completed_courses, exclude_subgroup='practice_hours')
    available_required = get_available_with_equiv('required', db, major_id, completed_courses, lang)

    core = get_credits_with_equiv('elective', db, major_id, completed_courses, subgroup='elective_core_credits')
    info = get_credits_with_equiv('elective', db, major_id, completed_courses, subgroup='elective_info_credits')
    non_core = get_credits_with_equiv('elective', db, major_id, completed_courses, subgroup='elective_non_core_credits')
    available_core = get_available_with_equiv('elective', db, major_id, completed_courses, lang, subgroup='elective_core_credits')
    available_info = get_available_with_equiv('elective', db, major_id, completed_courses, lang, subgroup='elective_info_credits')
    available_non_core = get_available_with_equiv('elective', db, major_id, completed_courses, lang, subgroup='elective_non_core_credits')

    optional = get_credits_with_equiv('optional', db, major_id, completed_courses)
    available_optional = get_available_with_equiv('optional', db, major_id, completed_courses, lang)

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

    available_thesis1 = get_available_thesis("IB970", "Szakdolgozat készítése 1. (gi)", db, major_id, completed_courses, lang)
    available_thesis2 = get_available_thesis("IB975", "Szakdolgozat készítése 2. (gi)", db, major_id, completed_courses, lang)

    practice_completed_hours, practice_required_hours, practice_missing_hours, available_practice = get_practice_hours(user_id, db, major_id, req)
    pe_semesters, available_pe = get_pe_semesters(user_id, db, major_id)

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