import json
import re
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import text


def _parse_prerequisites(raw: Any) -> list[str]:
    """
    A `course_major.prerequisites` mező formátuma nem teljesen konzisztens lehet,
    ezért próbáljuk előbb JSON-ként, majd komával szeparált tokenekként értelmezni.
    """
    if raw is None:
        return []

    if isinstance(raw, list):
        return [str(x).strip().upper() for x in raw if str(x).strip()]

    s = str(raw).strip()
    if not s:
        return []

    # JSON array?
    if s.startswith("["):
        try:
            arr = json.loads(s)
            if isinstance(arr, list):
                return [str(x).strip().upper() for x in arr if str(x).strip()]
        except Exception:
            pass

    # Fallback: vessző/újsor/szűkítő karakterek alapján tokenek
    s = s.replace(";", ",").replace("\n", ",").replace("\r", ",")
    return [t.strip().upper() for t in s.split(",") if t.strip()]


class CourseRecommendationsService:
    def __init__(self, db: Session):
        self.db = db

    def recommend_courses(
        self,
        user_id: int,
        course_codes: set[str],
        semester_parity: str,
        lang: str = "hu",
        limit: int = 20,
    ) -> dict:
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

        # Ne ajánljuk a már teljesített / folyamatban lévő kurzusokat.
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
        current_semester_estimate = (max(completed_semesters) + 1) if completed_semesters else 1

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

        # Jelölt kurzusok az adott majorból.
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
                    cm.subgroup,
                    cm.prerequisites
                FROM course_major cm
                JOIN courses c ON c.id = cm.course_id
                WHERE cm.major_id = :mid
                """
            ),
            {"mid": major_id},
        ).fetchall()

        parity = (semester_parity or "any").lower()
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

        scored = []
        for row in rows:
            course_id, course_code, name_hu, name_en, semester, credit, ctype, subgroup, prereq_raw = row

            if course_id in taken_course_ids:
                continue
            if not parity_ok(semester):
                continue

            prereqs = _parse_prerequisites(prereq_raw)
            prereq_set = set(prereqs)
            matched_input_prereq = course_codes.intersection(prereq_set)
            matched_completed_prereq = completed_codes.intersection(prereq_set)

            course_name = name_en if lang == "en" and name_en else name_hu
            candidate_tokens = _tokens(course_name or "")
            token_overlap = len(candidate_tokens.intersection(input_name_tokens))

            ctype_norm = str(ctype or "").strip().lower()
            subgroup_norm = str(subgroup or "").strip().lower()
            type_similarity = 1 if ctype_norm and ctype_norm in completed_types else 0
            subgroup_similarity = 2 if subgroup_norm and subgroup_norm in completed_subgroups else 0

            try:
                sem_int = int(semester)
            except Exception:
                sem_int = None

            is_overdue = sem_int is not None and sem_int <= current_semester_estimate
            overdue_distance = (current_semester_estimate - sem_int) if is_overdue and sem_int is not None else 0

            urgency_score = 0
            if is_overdue:
                urgency_score = 50 + min(20, overdue_distance * 3)

            similarity_score = (
                len(matched_input_prereq) * 8
                + len(matched_completed_prereq) * 3
                + token_overlap * 2
                + type_similarity * 2
                + subgroup_similarity
            )
            total_score = urgency_score + similarity_score

            reasons = []
            if is_overdue:
                reasons.append("overdue_by_recommended_semester")
            if matched_input_prereq:
                reasons.append("matches_input_prerequisites")
            if matched_completed_prereq:
                reasons.append("matches_completed_prerequisites")
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
                    "subgroup": subgroup,
                    "matched_prerequisites": sorted(matched_input_prereq),
                    "matched_completed_prerequisites": sorted(matched_completed_prereq),
                    "is_overdue": bool(is_overdue),
                    "urgency_score": urgency_score,
                    "similarity_score": similarity_score,
                    "score": total_score,
                    "reasons": reasons,
                }
            )

        scored.sort(
            key=lambda x: (
                not x.get("is_overdue", False),
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
        }

