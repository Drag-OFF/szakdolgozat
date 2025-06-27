from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.schemas import ResetPasswordRequest
from app.services.users_service import reset_password

router = APIRouter()

@router.post("/reset-password")
def reset_password_endpoint(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    success, message = reset_password(db, data.token, data.password)
    return {"success": success, "message": message}