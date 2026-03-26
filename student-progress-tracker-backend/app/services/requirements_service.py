"""
A szakos követelmények (requirements) számítási és lekérdezési logikája.
Ez a modul tartalmazza a felhasználó szakos követelményeinek, teljesített és hiányzó kreditjeinek,
elérhető kurzusainak kiszámításához szükséges segédfüggvényeket és a fő összesítő függvényt.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.services.major_requirement_rule_order import major_requirement_rule_sort_key


def get_dynamic_rules(major_id: int, db: Session):
    rows = db.execute(text("""
        SELECT id, major_id, code, label_hu, label_en, requirement_type, subgroup, value_type, min_value, include_in_total
        FROM major_requirement_rules
        WHERE major_id = :mid
    """), {"mid": major_id}).fetchall()
    return sorted(rows, key=major_requirement_rule_sort_key)

def get_major_and_requirements(user_id: int, db: Session):
    """
    Lekéri a felhasználó szakját és a szak követelményeit.

    Args:
        user_id (int): A felhasználó azonosítója.
        db (Session): SQLAlchemy adatbázis kapcsolat.

    Returns:
        tuple: (major neve, major_id)
    """
    user = db.execute(text("SELECT major FROM users WHERE id = :uid"), {"uid": user_id}).fetchone()
    if not user:
        raise ValueError("Felhasználó nem található.")
    major = user.major
    major_id = db.execute(text("SELECT id FROM majors WHERE name = :major"), {"major": major}).scalar()
    return major, major_id

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

def _pe_course_major_where(subgroup) -> tuple[str, dict]:
    """
    Testnevelés (PE) sorok szűrése a course_major táblán — összhangban a get_pe_semesters logikájával:
    (type = 'pe' OR subgroup = 'pe'). Ha a szabály subgroupja 'pe', de a kurzus csak type='pe'
    üres subgroupbal van felvéve, az is ide tartozik (tipikus admin-beállítás).
    """
    base = "(cm.type = 'pe' OR cm.subgroup = 'pe')"
    if subgroup == "__NULL__":
        return base + " AND cm.subgroup IS NULL", {}
    if subgroup:
        sg = str(subgroup).strip()
        if sg == "pe":
            return (
                base + " AND (cm.subgroup = :sg OR (cm.subgroup IS NULL AND cm.type = 'pe'))",
                {"sg": sg},
            )
        return base + " AND cm.subgroup = :sg", {"sg": sg}
    return base, {}


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
            sg = str(subgroup).strip()
            if type_ == "pe" and sg == "pe":
                sql += " AND (subgroup = :sg OR (subgroup IS NULL AND type = 'pe'))"
                params["sg"] = sg
            else:
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
    if type_ == "pe":
        frag, extra = _pe_course_major_where(subgroup)
        sql = f"""
            SELECT cm.course_id
            FROM course_major cm
            WHERE cm.major_id = :mid AND {frag}
        """
        params = {"mid": major_id, **extra}
    else:
        sql = """
            SELECT cm.course_id
            FROM course_major cm
            WHERE cm.major_id = :mid AND cm.type = :type
        """
        params = {"mid": major_id, "type": type_}
        if subgroup == "__NULL__":
            sql += " AND cm.subgroup IS NULL"
        elif subgroup == "elective_non_core_credits":
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
    if type_ == "pe":
        frag, extra = _pe_course_major_where(subgroup)
        sql = f"""
            SELECT cm.course_id, c.course_code, c.name, c.name_en, cm.semester, cm.credit
            FROM course_major cm
            JOIN courses c ON cm.course_id = c.id
            WHERE cm.major_id = :mid AND {frag}
        """
        params = {"mid": major_id, **extra}
    else:
        sql = """
            SELECT cm.course_id, c.course_code, c.name, c.name_en, cm.semester, cm.credit
            FROM course_major cm
            JOIN courses c ON cm.course_id = c.id
            WHERE cm.major_id = :mid AND cm.type = :type
        """
        params = {"mid": major_id, "type": type_}
        if subgroup == "__NULL__":
            sql += " AND cm.subgroup IS NULL"
        elif subgroup == "elective_non_core_credits":
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

def get_completed_count(type_: str, db: Session, major_id: int, completed_courses: set, subgroup=None) -> int:
    """
    Teljesített kurzusok darabszáma ekvivalencia nélkül (egyszerű számolás).
    """
    if type_ == "pe":
        frag, extra = _pe_course_major_where(subgroup)
        sql = f"""
            SELECT cm.course_id
            FROM course_major cm
            WHERE cm.major_id = :mid AND {frag}
        """
        params = {"mid": major_id, **extra}
    else:
        sql = """
            SELECT cm.course_id
            FROM course_major cm
            WHERE cm.major_id = :mid AND cm.type = :type
        """
        params = {"mid": major_id, "type": type_}
        if subgroup == "__NULL__":
            sql += " AND cm.subgroup IS NULL"
        elif subgroup:
            sql += " AND cm.subgroup = :sg"
            params["sg"] = subgroup
    ids = [row[0] for row in db.execute(text(sql), params).fetchall()]
    return len([cid for cid in ids if cid in completed_courses])

def get_completed_hours(type_: str, db: Session, major_id: int, user_id: int, subgroup=None) -> int:
    """
    Óra alapú követelményhez összegzi a completed_semester mezőt.
    """
    sql = """
        SELECT COALESCE(SUM(p.completed_semester), 0)
        FROM progress p
        JOIN course_major cm ON cm.course_id = p.course_id
        WHERE p.user_id = :uid
          AND p.status IN ('completed', 'in_progress')
          AND cm.major_id = :mid
          AND cm.type = :type
    """
    params = {"uid": user_id, "mid": major_id, "type": type_}
    if subgroup == "__NULL__":
        sql += " AND cm.subgroup IS NULL"
    elif subgroup:
        sql += " AND cm.subgroup = :sg"
        params["sg"] = subgroup
    return db.execute(text(sql), params).scalar() or 0

def build_dynamic_requirements(user_id: int, major: str, major_id: int, lang: str, db: Session, completed_courses: set) -> dict:
    rules = get_dynamic_rules(major_id, db)
    rows = []
    completed_total = 0
    required_total = 0

    for r in rules:
        rule_type = r.requirement_type
        subgroup = r.subgroup
        value_type = (r.value_type or "credits").lower()
        # Testnevelés: a course_major.credit általában 0; a teljesítést darabszámmal mérjük (hány TN tárgy / félév).
        if rule_type == "pe":
            value_type = "count"

        if value_type == "hours":
            completed = get_completed_hours(rule_type, db, major_id, user_id, subgroup=subgroup)
            available_courses = get_available_with_equiv(rule_type, db, major_id, completed_courses, lang, subgroup=subgroup)
        elif value_type == "count":
            completed = get_completed_count(rule_type, db, major_id, completed_courses, subgroup=subgroup)
            available_courses = get_available_with_equiv(rule_type, db, major_id, completed_courses, lang, subgroup=subgroup)
        else:
            completed = get_credits_with_equiv(rule_type, db, major_id, completed_courses, subgroup=subgroup)
            available_courses = get_available_with_equiv(rule_type, db, major_id, completed_courses, lang, subgroup=subgroup)

        required = int(r.min_value or 0)
        completed_int = int(completed or 0)
        # Túlteljesítés: a diplomaösszesítőben csak a követelményig számít bele (felesleg nem)
        counted_for_total = min(completed_int, required) if required >= 0 else completed_int
        excess = max(0, completed_int - required)
        missing = max(0, required - completed_int)

        if int(r.include_in_total or 0) == 1:
            completed_total += counted_for_total
            required_total += required

        rows.append({
            "id": r.id,
            "code": r.code,
            "label": (r.label_en if lang == "en" and r.label_en else r.label_hu) or r.code,
            "label_hu": r.label_hu,
            "label_en": r.label_en,
            "requirement_type": rule_type,
            "subgroup": subgroup,
            "value_type": value_type,
            "completed": completed_int,
            "required": required,
            "missing": missing,
            "excess": excess,
            "include_in_total": bool(r.include_in_total),
            "available_courses": available_courses
        })

    return {
        "mode": "dynamic",
        "major": major,
        "requirements": rows,
        "summary": {
            "completed_total": completed_total,
            "required_total": required_total,
            "missing_total": max(0, required_total - completed_total)
        }
    }

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
    major, major_id = get_major_and_requirements(user_id, db)
    completed_courses = get_completed_courses(user_id, db)

    dynamic_rules = get_dynamic_rules(major_id, db)
    if dynamic_rules:
        return build_dynamic_requirements(user_id, major, major_id, lang, db, completed_courses)
    return {
        "mode": "dynamic",
        "major": major,
        "requirements": [],
        "summary": {
            "completed_total": 0,
            "required_total": 0,
            "missing_total": 0
        },
        "message": "No dynamic requirement rules configured for this major."
    }
