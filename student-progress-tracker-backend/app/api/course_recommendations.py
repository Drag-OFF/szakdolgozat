from typing import Literal, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.course_recommendations_service import CourseRecommendationsService
from app.utils.utils import get_current_user


router = APIRouter()


class CourseRecommendationsRequest(BaseModel):
    course_codes: List[str] = Field(..., min_length=1)
    semester_parity: Literal["even", "odd", "any"] = "any"


@router.post("/{user_id}")
def recommend_courses(
    user_id: int,
    payload: CourseRecommendationsRequest,
    lang: str = "hu",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Kurzusajánló a megadott kurzuskódok prereq (előfeltétel) egyezése alapján.
    """
    try:
        if current_user.get("role") != "admin" and int(current_user.get("user_id", -1)) != int(user_id):
            raise HTTPException(status_code=403, detail="Nincs jogosultságod az ajánlások lekéréséhez.")

        codes = {str(c).strip().upper() for c in payload.course_codes if str(c).strip()}
        if not codes:
            raise HTTPException(status_code=400, detail="Legalább egy érvényes kurzuskód szükséges.")

        svc = CourseRecommendationsService(db)
        return svc.recommend_courses(
            user_id=user_id,
            course_codes=codes,
            semester_parity=payload.semester_parity,
            lang=lang,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

