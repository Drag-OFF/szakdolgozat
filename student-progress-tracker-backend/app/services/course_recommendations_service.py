import json
import re
import statistics
from collections import Counter
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
        due_scope: str = "all",
        course_type_filter: str = "all",
        lang: str = "hu",
        limit: int = 20,
    ) -> dict:
        def estimate_current_semester_from_completed(raw_semesters: list[Any]) -> int:
            """
            Robusztus becslés:
            - a completed szemeszterek mediánja adja az alapot
            - egyszeri, nagyon magas kiugró értékek ne húzzák fel a becslést
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
                return 1

            semesters.sort()
            median_sem = int(round(statistics.median(semesters)))
            counts = Counter(semesters)

            # Kiugró felső értékek szűrése: ha a mediánnál jóval nagyobb szemeszter
            # csak egyszer fordul elő, ne tekintsük reprezentatívnak.
            upper_outlier_floor = median_sem + 2
            filtered = [
                s for s in semesters
                if s <= upper_outlier_floor or counts[s] >= 2
            ]
            if not filtered:
                filtered = semesters

            representative_sem = int(round(statistics.median(filtered)))
            return max(1, representative_sem + 1)

        def estimate_current_semester_by_credits(
            completed_credit_sum: int,
            semester_credit_rows: list[Any],
            fallback_semesters: list[Any],
        ) -> int:
            """
            Kredit-alapú becslés a szak mintatantervéből:
            - félévenkénti kreditekből kumulált kreditgörbe készül
            - azt nézzük, meddig "fedezi" a hallgató teljesített kreditje a görbét
            - az aktuális félév = utolsó lefedett félév + 1
            """
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
                return estimate_current_semester_from_completed(fallback_semesters)

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

            # Ha a user már több kreditet teljesített, mint a teljes görbe vége,
            # tegyük a következő szemeszterre.
            if completed_credit_sum >= cumulative and passed_semester == max_semester:
                return max_semester + 1

            return max(1, passed_semester + 1)

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

        if completed_count > 0 and mapped_count > 0:
            current_semester_estimate = estimate_current_semester_by_credits(
                completed_credit_sum=completed_credit_sum,
                semester_credit_rows=semester_credit_rows,
                fallback_semesters=completed_semesters,
            )
        else:
            current_semester_estimate = estimate_current_semester_from_completed(completed_semesters)

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

        # Ha nincs megadott input, az elvégzett tárgyakból képezzük a tématokeneket.
        if not input_name_tokens:
            for r in completed_rows:
                input_name_tokens |= _tokens(r[2] or "")
                input_name_tokens |= _tokens(r[3] or "")

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

        prereq_reverse_graph: dict[str, int] = {}
        for row in rows:
            prereqs = _parse_prerequisites(row[8])
            for pre in prereqs:
                prereq_reverse_graph[pre] = prereq_reverse_graph.get(pre, 0) + 1

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

        scored = []
        for row in rows:
            course_id, course_code, name_hu, name_en, semester, credit, ctype, subgroup, prereq_raw = row

            if course_id in taken_course_ids:
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

            if not parity_ok(semester):
                continue
            if due_scope_norm == "due_only" and not is_overdue:
                continue

            normalized_type = normalize_course_type(ctype_norm)
            if type_filter_norm != "all" and normalized_type != type_filter_norm:
                continue

            urgency_score = 0
            if is_overdue:
                urgency_score = 50 + min(20, overdue_distance * 3)

            prereq_total = len(prereq_set)
            prereq_completed_ratio = (len(matched_completed_prereq) / prereq_total) if prereq_total > 0 else 1.0
            prereq_progress_score = int(prereq_completed_ratio * 30)

            # Előfeltétel-háló hatás: hány tárgyhoz előfeltétel a jelölt kurzus.
            unlock_impact = prereq_reverse_graph.get(str(course_code or "").strip().upper(), 0)
            unlock_impact_score = min(30, unlock_impact * 3)

            similarity_score = (
                len(matched_input_prereq) * 8
                + len(matched_completed_prereq) * 3
                + token_overlap * 2
                + type_similarity * 2
                + subgroup_similarity
            )
            total_score = urgency_score + similarity_score + prereq_progress_score + unlock_impact_score

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
            if prereq_progress_score >= 20:
                reasons.append("prerequisites_almost_satisfied")
            if unlock_impact > 0:
                reasons.append("high_prerequisite_impact")
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
                    "matched_prerequisites": sorted(matched_input_prereq),
                    "matched_completed_prerequisites": sorted(matched_completed_prereq),
                    "prerequisite_progress_score": prereq_progress_score,
                    "prerequisite_progress_ratio": round(prereq_completed_ratio, 3),
                    "unlock_impact_count": unlock_impact,
                    "unlock_impact_score": unlock_impact_score,
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

