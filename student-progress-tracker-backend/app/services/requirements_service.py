"""
A szakos követelmények (requirements) számítási és lekérdezési logikája.
Ez a modul tartalmazza a felhasználó szakos követelményeinek, teljesített és hiányzó kreditjeinek,
elérhető kurzusainak kiszámításához szükséges segédfüggvényeket és a fő összesítő függvényt.

Dinamikus mód: egy szabály teljesítése (kredit / darab / óra) és az elérhető tárgyak listája
a fa alatt lévő összes leszármazott szabály course_major.subgroup értékére vonatkozó tárgyak
uniójából számolódik — így a szülő sor magában foglalja a közvetlen és a gyerek alá sorolt tárgyakat.

**Specializációs fák:** A ``major_requirement_rules.is_specialization_root`` jelöli a kölcsönösen kizáró fa gyökereket
(bármilyen ``code`` lehet: MK-S-*, SP-*, JR-*, stb.); a hallgató egy ágat vagy NONE-t választhat.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.services.major_requirement_rule_order import major_requirement_rule_sort_key

SPECIALIZATION_NONE_SENTINEL = "NONE"

def _cm_types_for_requirement_rule(rule_type: str, rule_code: str | None) -> tuple[str, ...]:
    rt = (rule_type or "").strip().lower()
    rc = (rule_code or "").strip().upper()
    if rt == "required" and rc and rc.startswith("MK-"):
        
        
        return ("required", "elective", "optional")
    return (rt,)


def _sql_cm_type_clause(cm_types: tuple[str, ...]) -> tuple[str, dict]:
    uniq = tuple(dict.fromkeys(str(t or "").strip().lower() for t in cm_types if str(t or "").strip()))
    if not uniq:
        return "cm.type = :_cm_type0", {"_cm_type0": "required"}
    if len(uniq) == 1:
        return "cm.type = :_cm_type0", {"_cm_type0": uniq[0]}
    names = []
    params: dict[str, str] = {}
    for i, t in enumerate(uniq):
        k = f"_cm_type{i}"
        names.append(f":{k}")
        params[k] = t
    return f"cm.type IN ({', '.join(names)})", params


def rule_is_specialization_root(r) -> bool:
    """ORM sor vagy ``get_dynamic_rules`` Row: explicit admin jelölés, nem kódprefix."""
    v = getattr(r, "is_specialization_root", None)
    if v is None:
        return False
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return bool(int(v))
    if isinstance(v, str):
        return v.strip().lower() in ("1", "true", "yes")
    return bool(v)


def _norm_sg(s) -> str:
    return (s or "").strip()


def _rule_subtree_codes(rules) -> dict[str, set[str]]:
    """
    rule.code (nagybetű) -> {önmaga, minden leszármazott rule code} a parent_rule_code fa alapján.
    """
    by_parent: dict[str, list[str]] = {}
    all_codes: set[str] = set()
    for r in rules:
        c = (r.code or "").strip().upper()
        if not c:
            continue
        all_codes.add(c)
        p = (getattr(r, "parent_rule_code", None) or "").strip().upper()
        if p:
            by_parent.setdefault(p, []).append(c)
    subtrees: dict[str, set[str]] = {}
    for c in all_codes:
        acc: set[str] = {c}
        stack = list(by_parent.get(c, []))
        while stack:
            ch = (stack.pop() or "").strip().upper()
            if not ch or ch in acc:
                continue
            acc.add(ch)
            stack.extend(by_parent.get(ch, []))
        subtrees[c] = acc
    return subtrees


def _cm_subgroups_for_rule_subtree(rules, subtree_rule_codes: set[str]) -> set[str]:
    """A fában szereplő szabályok course_major.subgroup kulcsai (általában a rule.code)."""
    by_code = {(r.code or "").strip().upper(): r for r in rules}
    out: set[str] = set()
    for c in subtree_rule_codes:
        cc = (c or "").strip().upper()
        if not cc:
            continue
        row = by_code.get(cc)
        if row:
            sg = (row.subgroup or row.code or "").strip().upper()
            if sg:
                out.add(sg)
        else:
            out.add(cc)
    return out


def _augment_cm_subgroups_for_aggregate_rule(
    db: Session,
    major_id: int,
    rule_code: str,
    cm_subs: set[str],
) -> set[str]:
    """
    Általános aggregátum fallback:
    ha egy MK-DIF-* szabályhoz a kurzusok ténylegesen specializációs (MK-S-*)
    részblokkok alá kerültek, akkor ezeket is bevonjuk.
    """
    rc = (rule_code or "").strip().upper()
    out = set(cm_subs or set())
    if not rc.startswith("MK-DIF-"):
        return out

    tail = rc[len("MK-DIF-") :].strip()
    tokens = [t for t in tail.split("-") if t]
    if not tokens:
        return out

    primary = tokens[0]
    primary_like = f"%{primary}%"
    rows = db.execute(
        text(
            """
            SELECT DISTINCT UPPER(TRIM(subgroup))
            FROM course_major
            WHERE major_id = :mid
              AND subgroup IS NOT NULL
              AND UPPER(TRIM(subgroup)) LIKE 'MK-S-%'
              AND UPPER(TRIM(subgroup)) LIKE :p_like
            """
        ),
        {"mid": major_id, "p_like": primary_like},
    ).fetchall()
    out.update(str(r[0]).strip().upper() for r in rows if r and r[0])
    return out


def get_dynamic_rules(major_id: int, db: Session):
    rows = db.execute(text("""
        SELECT id, major_id, code, label_hu, label_en, requirement_type, subgroup, parent_rule_code,
               value_type, min_value, include_in_total, is_specialization_root
        FROM major_requirement_rules
        WHERE major_id = :mid
    """), {"mid": major_id}).fetchall()
    return sorted(rows, key=major_requirement_rule_sort_key)


def _parent_to_children_map(rules) -> dict[str, list[str]]:
    m: dict[str, list[str]] = {}
    for r in rules:
        c = (r.code or "").strip().upper()
        p = (getattr(r, "parent_rule_code", None) or "").strip().upper()
        if p and c:
            m.setdefault(p, []).append(c)
    return m


def _subtree_codes(parent_children: dict[str, list[str]], root: str) -> set[str]:
    root_u = (root or "").strip().upper()
    if not root_u:
        return set()
    acc: set[str] = {root_u}
    stack = [root_u]
    while stack:
        cur = stack.pop()
        for ch in parent_children.get(cur, ()):
            chu = (ch or "").strip().upper()
            if chu and chu not in acc:
                acc.add(chu)
                stack.append(chu)
    return acc


def collect_specialization_branches_from_rules(rules) -> list[dict]:
    """``is_specialization_root`` jelölt szabályok (egyedi code) címkével."""
    seen: set[str] = set()
    out: list[dict] = []
    for r in rules:
        if not rule_is_specialization_root(r):
            continue
        c = (r.code or "").strip().upper()
        if not c or c in seen:
            continue
        seen.add(c)
        out.append({
            "code": c,
            "label_hu": r.label_hu,
            "label_en": r.label_en,
        })
    out.sort(key=lambda x: x["code"])
    return out


def get_specialization_branches_for_major(major_id: int, db: Session) -> list[dict]:
    rules = get_dynamic_rules(major_id, db)
    return collect_specialization_branches_from_rules(rules)


def effective_specialization_choice_from_active(active: set[str], chosen_raw: str | None) -> str | None:
    """A DB-ben tárolt választás érvényes része a szakhoz; üres áglista esetén mindig None."""
    if not active:
        return None
    if chosen_raw is None or str(chosen_raw).strip() == "":
        return None
    cu = str(chosen_raw).strip().upper()
    if cu == SPECIALIZATION_NONE_SENTINEL:
        return SPECIALIZATION_NONE_SENTINEL
    if cu not in active:
        return None
    return cu


def validate_chosen_specialization_for_major_name(major_name: str, code: str | None, db: Session) -> str | None:
    """
    PATCH/PUT normalizálás: None = törlés. ValueError, ha a szakhoz nincs ág, de nem üres kódot küldenek,
    vagy a kód nem szerepel a szabályokban (és nem NONE).
    """
    major_id = db.execute(text("SELECT id FROM majors WHERE name = :m"), {"m": major_name}).scalar()
    if major_id is None:
        raise ValueError("Ismeretlen szak.")
    branches = get_specialization_branches_for_major(major_id, db)
    active = {b["code"] for b in branches}
    if code is None or (isinstance(code, str) and not str(code).strip()):
        return None
    cu = str(code).strip().upper()
    if not active:
        raise ValueError("Ehhez a szakhoz nincs specializációs ág megjelölve a szabályokban; csak üres érték engedélyezett.")
    if cu == SPECIALIZATION_NONE_SENTINEL:
        return SPECIALIZATION_NONE_SENTINEL
    if cu not in active:
        opts = ", ".join(sorted(active))
        raise ValueError(f"Érvénytelen specializáció ehhez a szakhoz. Engedélyezettek: üres, NONE, {opts}.")
    return cu


def filter_major_requirement_rules_by_specialization(rules, chosen_norm: str | None) -> list:
    """
    chosen_norm: None = nincs szűrés; egy jelölt gyökér kódja = csak ez az ág + közös szabályok;
    NONE = minden ``is_specialization_root`` fa kizárva (spec nélküli differenciált út).
    """
    active_roots = {
        (r.code or "").strip().upper()
        for r in rules
        if rule_is_specialization_root(r)
    }
    if not active_roots:
        return list(rules)
    if not chosen_norm:
        return list(rules)
    cu = str(chosen_norm).strip().upper()
    if cu != SPECIALIZATION_NONE_SENTINEL and cu not in active_roots:
        return list(rules)
    pcm = _parent_to_children_map(rules)
    excluded: set[str] = set()
    if cu == SPECIALIZATION_NONE_SENTINEL:
        for root in active_roots:
            excluded |= _subtree_codes(pcm, root)
    else:
        for root in active_roots:
            if root != cu:
                excluded |= _subtree_codes(pcm, root)
    return [r for r in rules if (r.code or "").strip().upper() not in excluded]


def get_user_chosen_specialization_code(user_id: int, db: Session) -> str | None:
    row = db.execute(
        text("SELECT chosen_specialization_code FROM users WHERE id = :uid"),
        {"uid": user_id},
    ).fetchone()
    if not row or row[0] is None:
        return None
    s = str(row[0]).strip()
    return s.upper() if s else None

def get_major_and_requirements(user_id: int, db: Session):
    """
    Lekéri a felhasználó szakját és a szak követelményeit.

    Paraméterek:
        user_id (int): A felhasználó azonosítója.
        db (Session): SQLAlchemy adatbázis kapcsolat.

    Visszatérés:
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

    Paraméterek:
        course_id (int): Kurzus azonosító.
        db (Session): SQLAlchemy adatbázis kapcsolat.

    Visszatérés:
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

    Paraméterek:
        user_id (int): A felhasználó azonosítója.
        db (Session): SQLAlchemy adatbázis kapcsolat.

    Visszatérés:
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

    Paraméterek:
        course_ids (set): Ekvivalens kurzusok azonosítói.
        completed_courses (set): Teljesített kurzusok azonosítói.

    Visszatérés:
        bool: True, ha legalább egy teljesítve van.
    """
    return any(cid in completed_courses for cid in course_ids)

def get_group_credit(
    course_ids: set,
    type_: str,
    db: Session,
    major_id: int,
    subgroup=None,
    *,
    cm_types: tuple[str, ...] | None = None,
) -> int:
    """
    Visszaadja egy ekvivalens kurzuscsoport kreditértékét.

    Paraméterek:
        course_ids (set): Ekvivalens kurzusok azonosítói.
        type_ (str): Kurzus típusa (fallback, ha nincs cm_types).
        db (Session): SQLAlchemy adatbázis kapcsolat.
        major_id (int): Szak azonosító.
        subgroup (str, optional): Alcsoport neve.
        cm_types: Több course_major.type (pl. required+elective MK-spec pool).

    Visszatérés:
        int: Kreditérték.
    """
    types_f = cm_types if cm_types is not None else (type_,)
    for cid in course_ids:
        frag, extra = _sql_cm_type_clause(types_f)
        sql = f"SELECT cm.credit FROM course_major cm WHERE cm.course_id = :cid AND cm.major_id = :mid AND {frag}"
        params = {"cid": cid, "mid": major_id, **extra}
        if subgroup:
            sg = str(subgroup).strip()
            if type_ == "pe" and sg == "pe":
                sql += " AND (cm.subgroup = :sg OR (cm.subgroup IS NULL AND cm.type = 'pe'))"
                params["sg"] = sg
            else:
                sql += " AND cm.subgroup = :sg"
                params["sg"] = subgroup
        credit = db.execute(text(sql), params).scalar()
        if credit:
            return credit
    return 0

def get_credits_with_equiv(
    type_: str,
    db: Session,
    major_id: int,
    completed_courses: set,
    subgroup=None,
    exclude_subgroup=None,
    *,
    cm_types: tuple[str, ...] | None = None,
) -> int:
    """
    Összesíti a teljesített krediteket egy típusra, ekvivalens kurzuscsoportokat figyelembe véve.

    Paraméterek:
        type_ (str): Kurzus típusa.
        db (Session): SQLAlchemy adatbázis kapcsolat.
        major_id (int): Szak azonosító.
        completed_courses (set): Teljesített kurzusok azonosítói.
        subgroup (str, optional): Alcsoport neve.
        exclude_subgroup (str, optional): Kizárt alcsoport.
        cm_types: Több course_major.type (MK-spec pool: required+elective).

    Visszatérés:
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
        types_f = cm_types if cm_types is not None else (type_,)
        tfrag, textra = _sql_cm_type_clause(types_f)
        sql = f"""
            SELECT cm.course_id
            FROM course_major cm
            WHERE cm.major_id = :mid AND {tfrag}
        """
        params = {"mid": major_id, **textra}
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
    ct = cm_types if cm_types is not None else None
    for cid in course_ids:
        group = get_equivalents(cid, db)
        group_key = tuple(sorted(group))
        if group_key in seen:
            continue
        seen.add(group_key)
        if is_group_completed(group, completed_courses):
            total += get_group_credit(group, type_, db, major_id, subgroup, cm_types=ct)
    return total


def get_credits_with_equiv_subgroups(
    type_: str,
    db: Session,
    major_id: int,
    completed_courses: set,
    subgroups: set[str],
    *,
    exclude_subgroup=None,
    cm_types: tuple[str, ...] | None = None,
) -> int:
    """Teljesített kredit több subgroup uniójára (szülő + leszármazott blokk kódok)."""
    subs = {_norm_sg(s).upper() for s in subgroups if _norm_sg(s)}
    if not subs:
        return 0
    return sum(
        get_credits_with_equiv(
            type_,
            db,
            major_id,
            completed_courses,
            subgroup=sg,
            exclude_subgroup=exclude_subgroup,
            cm_types=cm_types,
        )
        for sg in sorted(subs)
    )


def get_completed_count_subgroups(
    type_: str,
    db: Session,
    major_id: int,
    completed_courses: set,
    subgroups: set[str],
    *,
    cm_types: tuple[str, ...] | None = None,
) -> int:
    """Teljesített tárgyak darabszáma több subgroup unióján (ugyanaz a tárgy legfeljebb egy subgroupban)."""
    n = 0
    for sg in subgroups:
        s = _norm_sg(sg)
        if not s:
            continue
        n += get_completed_count(type_, db, major_id, completed_courses, subgroup=s, cm_types=cm_types)
    return n


def get_completed_hours_subgroups(
    type_: str, db: Session, major_id: int, user_id: int, subgroups: set[str]
) -> int:
    h = 0
    for sg in subgroups:
        s = _norm_sg(sg)
        if not s:
            continue
        h += int(get_completed_hours(type_, db, major_id, user_id, subgroup=s) or 0)
    return h


def get_available_with_equiv_subgroups(
    type_: str,
    db: Session,
    major_id: int,
    completed_courses: set,
    lang: str,
    subgroups: set[str],
    *,
    name_like=None,
    cm_types: tuple[str, ...] | None = None,
) -> list:
    seen = set()
    out: list = []
    for sg in sorted(s for s in subgroups if _norm_sg(s)):
        for item in get_available_with_equiv(
            type_,
            db,
            major_id,
            completed_courses,
            lang,
            subgroup=str(sg).strip(),
            name_like=name_like,
            cm_types=cm_types,
        ):
            k = item.get("course_code") or ""
            if k in seen:
                continue
            seen.add(k)
            out.append(item)
    return out


def get_available_with_equiv(
    type_: str,
    db: Session,
    major_id: int,
    completed_courses: set,
    lang: str,
    subgroup=None,
    name_like=None,
    *,
    cm_types: tuple[str, ...] | None = None,
) -> list:
    """
    Lekérdezi az elérhető (még nem teljesített) kurzusokat egy típusra, ekvivalens csoportokat figyelembe véve.

    Paraméterek:
        type_ (str): Kurzus típusa.
        db (Session): SQLAlchemy adatbázis kapcsolat.
        major_id (int): Szak azonosító.
        completed_courses (set): Teljesített kurzusok azonosítói.
        lang (str): Nyelv ('hu' vagy 'en').
        subgroup (str, optional): Alcsoport neve.
        name_like (str, optional): Kurzusnév szűrés.
        cm_types: Több course_major.type (MK-spec pool).

    Visszatérés:
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
        types_f = cm_types if cm_types is not None else (type_,)
        tfrag, textra = _sql_cm_type_clause(types_f)
        sql = f"""
            SELECT cm.course_id, c.course_code, c.name, c.name_en, cm.semester, cm.credit
            FROM course_major cm
            JOIN courses c ON cm.course_id = c.id
            WHERE cm.major_id = :mid AND {tfrag}
        """
        params = {"mid": major_id, **textra}
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


def _merge_available_courses_by_code(*lists: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for items in lists:
        for item in items or []:
            code = str(item.get("course_code") or "").strip().upper()
            if not code or code in seen:
                continue
            seen.add(code)
            out.append(item)
    return out

def get_completed_count(
    type_: str,
    db: Session,
    major_id: int,
    completed_courses: set,
    subgroup=None,
    *,
    cm_types: tuple[str, ...] | None = None,
) -> int:
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
        types_f = cm_types if cm_types is not None else (type_,)
        tfrag, textra = _sql_cm_type_clause(types_f)
        sql = f"""
            SELECT cm.course_id
            FROM course_major cm
            WHERE cm.major_id = :mid AND {tfrag}
        """
        params = {"mid": major_id, **textra}
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

def build_dynamic_requirements(
    user_id: int,
    major: str,
    major_id: int,
    lang: str,
    db: Session,
    completed_courses: set,
    *,
    chosen_specialization_code: str | None = None,
    rules_all=None,
) -> dict:
    """
    Szabályonkénti összesítés: teljesített / kötelező, elérhető tárgyak, túlteljesítés kezelése.

    Testnevelés (``pe``): a ``course_major.credit`` gyakran 0; teljesítés **darabszámmal** (hány TN tárgy / félév).

    Diplomaösszesítő sorban a ``counted_for_total`` legfeljebb a követelményig nő (túlteljesítés nem növeli a plafont).
    """
    if rules_all is None:
        rules_all = get_dynamic_rules(major_id, db)
    branches = collect_specialization_branches_from_rules(rules_all)
    active = {b["code"] for b in branches}
    eff = effective_specialization_choice_from_active(active, chosen_specialization_code)
    rules = filter_major_requirement_rules_by_specialization(rules_all, eff)
    subtrees = _rule_subtree_codes(rules)
    rows = []
    completed_total = 0
    required_total = 0

    for r in rules:
        rc = (r.code or "").strip().upper()
        rule_type = r.requirement_type
        subgroup = r.subgroup
        
        
        if rc == "MK-SZG":
            rule_type = "practice"
            
            if not subgroup:
                subgroup = "practice_hours"
        value_type = (r.value_type or "credits").lower()
        if rule_type == "pe":
            value_type = "count"
        elif rule_type == "practice":
            value_type = "hours"

        subtree_rule_codes = subtrees.get(rc, {rc} if rc else set())
        cm_subs = _cm_subgroups_for_rule_subtree(rules, subtree_rule_codes)
        if rc == "MK-SZG":
            cm_subs.update({"MK-SZG", "practice_hours"})
        cm_subs = _augment_cm_subgroups_for_aggregate_rule(db, major_id, rc, cm_subs)
        if not cm_subs and rc:
            cm_subs = {(subgroup or rc or "").strip().upper()} if (subgroup or rc) else set()

        cm_types = _cm_types_for_requirement_rule(rule_type, rc)

        if value_type == "hours":
            completed = get_completed_hours_subgroups(rule_type, db, major_id, user_id, cm_subs)
            available_courses = get_available_with_equiv_subgroups(
                rule_type, db, major_id, completed_courses, lang, cm_subs, cm_types=cm_types
            )
        elif value_type == "count":
            completed = get_completed_count_subgroups(
                rule_type, db, major_id, completed_courses, cm_subs, cm_types=cm_types
            )
            available_courses = get_available_with_equiv_subgroups(
                rule_type, db, major_id, completed_courses, lang, cm_subs, cm_types=cm_types
            )
        else:
            completed = get_credits_with_equiv_subgroups(
                rule_type, db, major_id, completed_courses, cm_subs, cm_types=cm_types
            )
            available_courses = get_available_with_equiv_subgroups(
                rule_type, db, major_id, completed_courses, lang, cm_subs, cm_types=cm_types
            )

        
        if rc == "MK-SZD" and not available_courses:
            thesis_hu = get_available_with_equiv(
                "required",
                db,
                major_id,
                completed_courses,
                lang,
                subgroup=None,
                name_like="%Szakdolgozat%",
                cm_types=("required", "elective", "optional"),
            )
            thesis_en = get_available_with_equiv(
                "required",
                db,
                major_id,
                completed_courses,
                lang,
                subgroup=None,
                name_like="%Thesis%",
                cm_types=("required", "elective", "optional"),
            )
            available_courses = _merge_available_courses_by_code(available_courses, thesis_hu, thesis_en)

        required = int(r.min_value or 0)
        completed_int = int(completed or 0)
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
            "parent_rule_code": getattr(r, "parent_rule_code", None),
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
        "chosen_specialization_code": eff,
        "specialization_branches": branches,
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

    Paraméterek:
        thesis_code (str): Szakdolgozat kurzus kódja.
        thesis_name (str): Szakdolgozat kurzus neve.
        db (Session): SQLAlchemy adatbázis kapcsolat.
        major_id (int): Szak azonosító.
        completed_courses (set): Teljesített kurzusok azonosítói.
        lang (str): Nyelv ('hu' vagy 'en').

    Visszatérés:
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

    Paraméterek:
        user_id (int): A felhasználó azonosítója.
        db (Session): SQLAlchemy adatbázis kapcsolat.
        major_id (int): Szak azonosító.
        req: Követelmény rekord.

    Visszatérés:
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

    Paraméterek:
        user_id (int): A felhasználó azonosítója.
        db (Session): SQLAlchemy adatbázis kapcsolat.
        major_id (int): Szak azonosító.

    Visszatérés:
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

    Paraméterek:
        user_id (int): A felhasználó azonosítója.
        lang (str): Nyelv ('hu' vagy 'en').
        db (Session): SQLAlchemy adatbázis kapcsolat.

    Visszatérés:
        dict: A követelmények, teljesített kreditek, elérhető kurzusok, stb.
    """
    major, major_id = get_major_and_requirements(user_id, db)
    completed_courses = get_completed_courses(user_id, db)
    chosen_spec = get_user_chosen_specialization_code(user_id, db)

    rules_all = get_dynamic_rules(major_id, db)
    if rules_all:
        return build_dynamic_requirements(
            user_id,
            major,
            major_id,
            lang,
            db,
            completed_courses,
            chosen_specialization_code=chosen_spec,
            rules_all=rules_all,
        )
    branches = collect_specialization_branches_from_rules(rules_all)
    eff = effective_specialization_choice_from_active({b["code"] for b in branches}, chosen_spec)
    return {
        "mode": "dynamic",
        "major": major,
        "chosen_specialization_code": eff,
        "specialization_branches": branches,
        "requirements": [],
        "summary": {
            "completed_total": 0,
            "required_total": 0,
            "missing_total": 0
        },
        "message": "No dynamic requirement rules configured for this major."
    }


def get_user_requirements_with_completed_courses(
    user_id: int,
    lang: str,
    db: Session,
    completed_courses_override: set[int],
) -> dict:
    """
    "What-if" számítás: ugyanolyan követelménylogika, de a completed kurzushalmaz felülírható.
    Nem ír adatot DB-be.
    """
    major, major_id = get_major_and_requirements(user_id, db)
    chosen_spec = get_user_chosen_specialization_code(user_id, db)
    completed_courses = set(completed_courses_override or set())

    rules_all = get_dynamic_rules(major_id, db)
    if rules_all:
        return build_dynamic_requirements(
            user_id,
            major,
            major_id,
            lang,
            db,
            completed_courses,
            chosen_specialization_code=chosen_spec,
            rules_all=rules_all,
        )
    branches = collect_specialization_branches_from_rules(rules_all)
    eff = effective_specialization_choice_from_active({b["code"] for b in branches}, chosen_spec)
    return {
        "mode": "dynamic",
        "major": major,
        "chosen_specialization_code": eff,
        "specialization_branches": branches,
        "requirements": [],
        "summary": {
            "completed_total": 0,
            "required_total": 0,
            "missing_total": 0,
        },
        "message": "No dynamic requirement rules configured for this major.",
    }
