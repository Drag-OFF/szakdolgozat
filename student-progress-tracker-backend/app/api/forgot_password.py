from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.schemas import ForgotPasswordRequest, ForgotPasswordResponse
from app.services.forgot_password_service import ForgotPasswordService

router = APIRouter()

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Elfelejtett jelszó végpont. Ha az e-mail létezik, elküldi a visszaállító linket.
    """
    service = ForgotPasswordService(db)
    success, message = service.process_forgot_password(data.email)
    return ForgotPasswordResponse(success=success, message=message)