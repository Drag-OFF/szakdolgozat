"""
Kurzusajánló: a hallgató szakjához tartozó, még nem felvett tárgyak rangsorolása.

Becsült „hol tartok” félév:
  - kreditgörbe: teljesített kredit vs. mintatanterv félévenkénti összkreditjei (nem a legnagyobb
    tárgyfélév számít, hanem mennyi kredit gyűlt össze a névleges sorrendben);
  - teljesített félévek mediánja (+1): a progress.completed_semester értékekre (melyik félévben
    végezte el a tárgyakat) — kiugró felső érték egy példány esetén szűrve;
  - ha mindkettő elérhető: átlag (kerekítve), így egy korán felvett „magas számú” tárgy kevésbé billenti el
    egymagában az összképet.

Páros/páratlan szűrés, tárgytípus, esedékesség, név-token és kategória hasonlóság.

Esedékesség („is_overdue” / piros jelölés): csak ha a tárgy típusa kötelező vagy kötelezően választható
és az ajánlott félév ≤ becsült aktuális félév. A szabadon választható (pl. speciálkollégium) nem kapja ugyanazt
a kritikus státuszt; a listában hátrébb kerül, mint a core követelmények.
"""

import re
import statistics
from collections import Counter
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import text


def _estimate_current_semester_from_completed_terms(raw_semesters: list[Any]) -> int | None:
    """
    A teljesített félévek (melyik félévben került teljesítésre a tárgy) mediánja, +1 = következő félév.

    Kiugró felső érték: ha a mediánnál >2-gyel nagyobb félév csak egyszer szerepel, nem reprezentatív
    (pl. véletlenül rossz szám / egy extrém tárgy).
    """
    semesters = []
    for v in raw_semesters:
        try:
            sem = int(v)
            if sem > 0:
                semesters.append(sem)
        except Exception:
            continue

    if not semesters:
        return None

    semesters.sort()
    median_sem = int(round(statistics.median(semesters)))
    counts = Counter(semesters)

    upper_outlier_floor = median_sem + 2
    filtered = [
        s for s in semesters
        if s <= upper_outlier_floor or counts[s] >= 2
    ]
    if not filtered:
        filtered = semesters

    representative_sem = int(round(statistics.median(filtered)))
    return max(1, representative_sem + 1)


def _estimate_current_semester_by_credit_curve(
    completed_credit_sum: int,
    semester_credit_rows: list[Any],
    fallback_semesters: list[Any],
) -> int | None:
    """Kredit-alapú becslés; ha nincs görbe, a teljesített félévek mediánja."""
    sem_credits: list[tuple[int, int]] = []
    for row in semester_credit_rows:
        try:
            sem = int(row[0])
            cred = int(row[1] or 0)
        except Exception:
            continue
        if sem <= 0:
            continue
        sem_credits.append((sem, max(0, cred)))

    if not sem_credits:
        return _estimate_current_semester_from_completed_terms(fallback_semesters)

    sem_credits.sort(key=lambda x: x[0])

    cumulative = 0
    passed_semester = 0
    max_semester = sem_credits[-1][0]
    for sem, cred in sem_credits:
        cumulative += cred
        if completed_credit_sum >= cumulative:
            passed_semester = sem
        else:
            break

    if completed_credit_sum >= cumulative and passed_semester == max_semester:
        return max_semester + 1

    return max(1, passed_semester + 1)


def _blend_semester_estimates(
    est_credits: int | None,
    est_terms: int | None,
) -> tuple[int, str]:
    """Vissza: (végső félév becslés, módszer kulcs)."""
    if est_credits is not None and est_terms is not None:
        blended = max(1, int(round((est_credits + est_terms) / 2)))
        return blended, "blend_avg"
    if est_credits is not None:
        return est_credits, "credit_curve"
    if est_terms is not None:
        return est_terms, "completed_term_median"
    return 1, "default"


class CourseRecommendationsService:
    """``recommend_courses``: szűrt, pontozott jelöltlista ``recommended`` kulccsal és okokkal."""

    def __init__(self, db: Session):
        self.db = db

    def recommend_courses(
        self,
        user_id: int,
        course_codes: set[str],
        semester_parity: str,
        due_scope: str = "all",
        course_type_filter: str = "all",
        lang: str = "hu",
        limit: int = 20,
    ) -> dict:
        """
        Paraméterek:
            user_id: Cél felhasználó (saját szak mintatantervéből dolgozik).
            course_codes: Opcionális input kódok név-tokenekhez (üres = teljesített tárgyakból token).
            semester_parity: ``any`` / ``even`` / ``odd``.
            due_scope: ``all`` vagy ``due_only`` (esedékes ajánlott félév szerint).
            course_type_filter: ``all`` / ``required`` / ``elective`` / ``optional``.
            lang: ``hu`` vagy ``en`` (megjelenő kurzusnév).
            limit: Visszaadott sorok max. száma.

        Visszatérés:
            major, semester_parity, recommended, current_semester_estimate, semester_estimate_detail, reason.
        """
        user_row = self.db.execute(text("SELECT major FROM users WHERE id = :uid"), {"uid": user_id}).fetchone()
        if not user_row:
            raise ValueError("Felhasználó nem található.")

        major_name = user_row.major
        major_id = self.db.execute(
            text("SELECT id FROM majors WHERE name = :mname"),
            {"mname": major_name},
        ).scalar()
        if not major_id:
            raise ValueError("A felhasználó szakához tartozó major nem található.")

        taken_course_ids = set(
            row[0]
            for row in self.db.execute(
                text("""
                    SELECT course_id
                    FROM progress
                    WHERE user_id = :uid AND status IN ('completed', 'in_progress')
                """),
                {"uid": user_id},
            ).fetchall()
        )

        completed_semesters = [
            row[0]
            for row in self.db.execute(
                text("""
                    SELECT completed_semester
                    FROM progress
                    WHERE user_id = :uid AND status = 'completed' AND completed_semester IS NOT NULL
                """),
                {"uid": user_id},
            ).fetchall()
            if row[0] is not None
        ]
        completed_credit_row = self.db.execute(
            text("""
                SELECT
                    COALESCE(SUM(COALESCE(cm.credit, 0)), 0) AS completed_credits,
                    COUNT(*) AS completed_count,
                    SUM(CASE WHEN cm.credit IS NOT NULL THEN 1 ELSE 0 END) AS mapped_count
                FROM progress p
                LEFT JOIN course_major cm ON cm.course_id = p.course_id AND cm.major_id = :mid
                WHERE p.user_id = :uid AND p.status = 'completed'
            """),
            {"uid": user_id, "mid": major_id},
        ).fetchone()
        completed_credit_sum = int((completed_credit_row[0] if completed_credit_row else 0) or 0)
        completed_count = int((completed_credit_row[1] if completed_credit_row else 0) or 0)
        mapped_count = int((completed_credit_row[2] if completed_credit_row else 0) or 0)

        semester_credit_rows = self.db.execute(
            text("""
                SELECT cm.semester, COALESCE(SUM(cm.credit), 0) AS semester_credits
                FROM course_major cm
                WHERE cm.major_id = :mid AND cm.semester IS NOT NULL
                GROUP BY cm.semester
                ORDER BY cm.semester
            """),
            {"mid": major_id},
        ).fetchall()

        est_by_credits: int | None = None
        if completed_count > 0 and mapped_count > 0:
            est_by_credits = _estimate_current_semester_by_credit_curve(
                completed_credit_sum=completed_credit_sum,
                semester_credit_rows=semester_credit_rows,
                fallback_semesters=completed_semesters,
            )

        est_by_terms: int | None = None
        if completed_semesters:
            est_by_terms = _estimate_current_semester_from_completed_terms(completed_semesters)

        current_semester_estimate, estimate_method = _blend_semester_estimates(est_by_credits, est_by_terms)

        semester_estimate_detail = {
            "by_major_credit_curve": est_by_credits,
            "by_completed_term_median": est_by_terms,
            "blended": current_semester_estimate,
            "method": estimate_method,
        }

        completed_rows = self.db.execute(
            text("""
                SELECT
                    c.id,
                    c.course_code,
                    c.name,
                    c.name_en,
                    cm.type,
                    cm.subgroup
                FROM progress p
                JOIN courses c ON c.id = p.course_id
                LEFT JOIN course_major cm ON cm.course_id = c.id AND cm.major_id = :mid
                WHERE p.user_id = :uid AND p.status = 'completed'
            """),
            {"uid": user_id, "mid": major_id},
        ).fetchall()
        completed_codes = {str(r[1]).strip().upper() for r in completed_rows if r[1]}
        completed_types = {str(r[4]).strip().lower() for r in completed_rows if r[4]}
        completed_subgroups = {str(r[5]).strip().lower() for r in completed_rows if r[5]}

        def _tokens(value: str) -> set[str]:
            s = str(value or "").lower()
            parts = re.split(r"[^a-z0-9áéíóöőúüű]+", s)
            return {p for p in parts if len(p) >= 3}

        input_rows = self.db.execute(
            text("""
                SELECT c.course_code, c.name, c.name_en
                FROM courses c
                WHERE UPPER(c.course_code) IN :codes
            """),
            {"codes": tuple(course_codes) if course_codes else tuple([""])},
        ).fetchall()
        input_name_tokens = set()
        for r in input_rows:
            input_name_tokens |= _tokens(r[1] or "")
            input_name_tokens |= _tokens(r[2] or "")

        if not input_name_tokens:
            for r in completed_rows:
                input_name_tokens |= _tokens(r[2] or "")
                input_name_tokens |= _tokens(r[3] or "")

        rows = self.db.execute(
            text(
                """
                SELECT
                    cm.course_id,
                    c.course_code,
                    c.name,
                    c.name_en,
                    cm.semester,
                    cm.credit,
                    cm.type,
                    cm.subgroup
                FROM course_major cm
                JOIN courses c ON c.id = cm.course_id
                WHERE cm.major_id = :mid
                """
            ),
            {"mid": major_id},
        ).fetchall()

        parity = (semester_parity or "any").lower()
        due_scope_norm = (due_scope or "all").lower()
        type_filter_norm = (course_type_filter or "all").lower()

        def normalize_course_type(raw_type: Any) -> str:
            s = str(raw_type or "").strip().lower()
            if s in {"required", "core", "kötelező", "kotelezo"}:
                return "required"
            if s in {"elective", "kötelezően választható", "kotelezoen valaszthato", "kötvál", "kotval"}:
                return "elective"
            if s in {"optional", "free", "szabadon választható", "szabadon valaszthato", "szabvál", "szabval"}:
                return "optional"
            return s or "unknown"

        def parity_ok(semester: Any) -> bool:
            try:
                sem = int(semester)
            except Exception:
                return True
            if parity == "even":
                return sem % 2 == 0
            if parity == "odd":
                return sem % 2 == 1
            return True

        def list_rank(row_dict: dict) -> int:
            """
            Rangsor: előbb a diplomaköteles útvonal (kötelező / kötvál) esedéses, aztán opcionális
            „elmúlt félév”, majd nem esedések — a szabadon választható (pl. speciálkollégium) nem kap
            ugyanolyan „esedékes” súlyt, mint a core követelmények.
            """
            past = row_dict.get("past_recommended_semester")
            nt = str(row_dict.get("normalized_type") or "unknown")
            slot = {"required": 0, "elective": 1, "optional": 2}.get(nt, 2)
            return (0 if past else 3) + slot

        scored = []
        for row in rows:
            course_id, course_code, name_hu, name_en, semester, credit, ctype, subgroup = row

            if course_id in taken_course_ids:
                continue

            course_name = name_en if lang == "en" and name_en else name_hu
            candidate_tokens = _tokens(course_name or "")
            token_overlap = len(candidate_tokens.intersection(input_name_tokens))

            ctype_norm = str(ctype or "").strip().lower()
            subgroup_norm = str(subgroup or "").strip().lower()
            type_similarity = 1 if ctype_norm and ctype_norm in completed_types else 0
            subgroup_similarity = 2 if subgroup_norm and subgroup_norm in completed_subgroups else 0

            normalized_type = normalize_course_type(ctype_norm)

            try:
                sem_int = int(semester)
            except Exception:
                sem_int = None

            past_recommended_semester = sem_int is not None and sem_int <= current_semester_estimate
            overdue_distance = (
                (current_semester_estimate - sem_int)
                if past_recommended_semester and sem_int is not None
                else 0
            )

            if not parity_ok(semester):
                continue

            # Követelmény útvonal: kötelező + kötelezően választható — ezekre „Esedékes” / nagyobb súly.
            # Szabadon választható: lehet elmúlt az ajánlott félév, de nem minősül ugyanúgy kritikusnak.
            degree_track_past = past_recommended_semester and normalized_type in ("required", "elective")

            if due_scope_norm == "due_only" and not degree_track_past:
                continue

            if type_filter_norm != "all" and normalized_type != type_filter_norm:
                continue

            # UI / API: is_overdue = csak diplomaköteles útvonalon (required/elective) + elmúlt ajánlott félév
            is_overdue = degree_track_past

            urgency_score = 0
            if past_recommended_semester:
                if normalized_type == "required":
                    urgency_score = 12 + min(32, overdue_distance * 4)
                elif normalized_type == "elective":
                    urgency_score = 8 + min(26, overdue_distance * 3)
                # optional: nem növelünk sürgősséget az „elmúlt félév” miatt — marad a hasonlóság

            similarity_score = (
                token_overlap * 2
                + type_similarity * 2
                + subgroup_similarity
            )
            total_score = urgency_score + similarity_score

            reasons = []
            if degree_track_past:
                reasons.append("overdue_by_recommended_semester")
            elif past_recommended_semester and normalized_type == "optional":
                reasons.append("past_suggested_semester_optional")
            if token_overlap > 0:
                reasons.append("name_similarity")
            if type_similarity > 0 or subgroup_similarity > 0:
                reasons.append("category_similarity")
            if not reasons:
                reasons.append("major_curriculum_candidate")

            scored.append(
                {
                    "course_id": course_id,
                    "course_code": course_code,
                    "course_name": course_name,
                    "semester": semester,
                    "credit": credit,
                    "category": ctype,
                    "normalized_type": normalized_type,
                    "subgroup": subgroup,
                    "past_recommended_semester": bool(past_recommended_semester),
                    "is_overdue": bool(is_overdue),
                    "urgency_score": urgency_score,
                    "similarity_score": similarity_score,
                    "score": total_score,
                    "reasons": reasons,
                }
            )

        scored.sort(
            key=lambda x: (
                list_rank(x),
                -int(x.get("score", 0)),
                x.get("semester") is None,
                int(x.get("semester") or 0),
                x.get("course_code") or "",
            )
        )
        return {
            "major": major_name,
            "semester_parity": parity,
            "recommended": scored[:limit],
            "reason": "priority_and_similarity",
            "current_semester_estimate": current_semester_estimate,
            "semester_estimate_detail": semester_estimate_detail,
        }

