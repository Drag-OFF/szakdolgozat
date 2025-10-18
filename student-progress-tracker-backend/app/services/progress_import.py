import openpyxl
from fastapi import HTTPException
from sqlalchemy import text
from app.db import models
from app.utils.translations import CATEGORY_MAP
from app.utils.utils import normalize_status, parse_int, get_error_message

class ProgressImportService:
    def __init__(self, db):
        self.db = db

    async def import_progress(self, user_id, file, lang: str = "hu"):
        """
        XLSX import: validál, gyűjti a mentendő objektumokat;
        ha nincs sorhiba, törli a régi rekordokat és menti az újak.
        Elfogadja a státusz magyar és angol formáit, adatbázisba canonical angol kulcs kerül.
        """
        try:
            wb = openpyxl.load_workbook(file.file, data_only=True)
            ws = wb.active
        except Exception:
            raise HTTPException(status_code=400, detail=get_error_message("formula_no_cached", lang))

        errors = []
        prepared = []
        seen_courses = set()
        ekvivalens_map = {}

        # load equivalences
        try:
            eq_rows = self.db.execute(text("SELECT course_id, equivalent_course_id FROM course_equivalence")).fetchall()
            for row in eq_rows:
                ekvivalens_map.setdefault(row[0], set()).add(row[1])
                ekvivalens_map.setdefault(row[1], set()).add(row[0])
        except Exception:
            pass

        # mapping: code(1), name(2), category(3), semester(4), credit(5), status(6), completed_semester(7), points(8)
        for idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            cells = list(row) if row is not None else []
            while len(cells) < 8:
                cells.append(None)
            if not any(cell is not None and str(cell).strip() != "" for cell in cells):
                continue

            code, name, category, semester, credit, status_raw, completed_raw, points = cells[:8]
            row_errors = []

            status_present = status_raw is not None and str(status_raw).strip() != ""
            completed_present = completed_raw is not None and str(completed_raw).strip() != ""

            # both empty -> skip row
            if not (status_present or completed_present):
                continue
            # exactly one present -> error
            if status_present ^ completed_present:
                row_errors.append(get_error_message("missing_pair", lang))

            # course code
            if not code or str(code).strip() == "":
                row_errors.append(get_error_message("missing_code", lang))
                course = None
            else:
                code_s = str(code).strip()
                course = self.db.query(models.Course).filter(models.Course.course_code == code_s).first()
                if not course:
                    row_errors.append(get_error_message("course_not_found", lang, code=code_s))

            # category validation
            valid_categories = set(CATEGORY_MAP["hu"].values()) | set(CATEGORY_MAP["en"].values())
            if category and category not in valid_categories:
                row_errors.append(f"Invalid category '{category}'.")

            # status normalization
            status_norm = None
            if status_present:
                status_norm = normalize_status(status_raw)
                if not status_norm:
                    row_errors.append(get_error_message("invalid_status", lang))

            # credit
            credit_val, credit_err = parse_int(credit)
            if credit_err:
                row_errors.append(get_error_message("invalid_number", lang, col="credit", val=credit))

            # points
            points_val, points_err = parse_int(points)
            if points_err:
                row_errors.append(get_error_message("invalid_number", lang, col="points", val=points))

            # semester (recommended)
            semester_val, sem_err = parse_int(semester)
            if sem_err:
                row_errors.append(get_error_message("invalid_number", lang, col="semester", val=semester))

            # completed_semester
            completed_val, comp_err = parse_int(completed_raw)
            if comp_err:
                row_errors.append(get_error_message("invalid_number", lang, col="completed_semester", val=completed_raw))

            if row_errors:
                errors.append({"row": idx, "errors": row_errors, "values": {"code": code, "status": status_raw, "completed_semester": completed_raw}})
                continue

            # duplicate / equivalent checks
            course_id = course.id if course else None
            if course_id:
                if course_id in seen_courses:
                    row_errors.append(get_error_message("duplicate_course", lang, code=code))
                    errors.append({"row": idx, "errors": row_errors})
                    continue
                for eq_id in ekvivalens_map.get(course_id, []):
                    if eq_id in seen_courses:
                        eq_course = self.db.query(models.Course).filter(models.Course.id == eq_id).first()
                        eq_code = eq_course.course_code if eq_course else str(eq_id)
                        row_errors.append(get_error_message("equivalent_course", lang, eq=eq_code, code=code))
                        errors.append({"row": idx, "errors": row_errors})
                        break
                if any(e for e in errors if e.get("row") == idx):
                    continue
                seen_courses.add(course_id)

            # prepare object
            computed_points = None
            if (status_norm or "in_progress") == "in_progress":
                computed_points = 2
            elif (status_norm or "") == "completed":
                if semester_val is None:
                    computed_points = 5
                else:
                    if completed_val is None:
                        computed_points = 5
                    else:
                        if completed_val < semester_val:
                            computed_points = 6
                        elif completed_val == semester_val:
                            computed_points = 5
                        else:
                            computed_points = 3
            else:
                # ha ismeretlen státusz, használjuk a fájlban adott pontot vagy 0-t
                computed_points = points_val if points_val is not None else 0

            # prepare object (pontszámmal)
            prepared.append(models.Progress(
                user_id=user_id,
                course_id=course_id,
                completed_semester=(completed_val if completed_val is not None else 0),
                status=(status_norm if status_norm is not None else "in_progress"),
                points=(computed_points if computed_points is not None else 0)
            ))

        if errors:
            return {"success": False, "imported": 0, "errors": errors}

        # commit: delete old -> save new
        try:
            self.db.query(models.Progress).filter(models.Progress.user_id == user_id).delete()
            self.db.commit()
            if prepared:
                self.db.bulk_save_objects(prepared)
                self.db.commit()
        except Exception:
            self.db.rollback()
            raise HTTPException(status_code=500, detail="Hiba történt az adatbázis mentésekor.")

        return {"success": True, "imported": len(prepared), "errors": []}