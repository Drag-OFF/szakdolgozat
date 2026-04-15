"""Elfelejtett jelszó: reset token + Mailjet e-mail küldés — ``ForgotPasswordService``."""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import uuid
from app.db.models import User
from mailjet_rest import Client
from app.config import (
    MAILJET_API_KEY,
    MAILJET_API_SECRET,
    PUBLIC_SITE_URL,
    MAIL_FROM_EMAIL,
    MAIL_FROM_NAME,
)

class ForgotPasswordService:
    """
    Elfelejtett jelszó logika: token generálás, e-mail küldés.
    """

    def __init__(self, db: Session):
        self.db = db

    def send_reset_email(self, to_email: str, reset_token: str):
        """
        Jelszó-visszaállító e-mail küldése Mailjet segítségével.
        """
        if not MAILJET_API_KEY or not MAILJET_API_SECRET:
            return 503, {"error": "Mailjet nincs konfigurálva a .env-ben."}
        mailjet = Client(auth=(MAILJET_API_KEY, MAILJET_API_SECRET), version="v3.1")
        reset_link = f"{PUBLIC_SITE_URL}/reset-password?token={reset_token}"
        data = {
            'Messages': [
                {
                    "From": {
                        "Email": MAIL_FROM_EMAIL,
                        "Name": MAIL_FROM_NAME
                    },
                    "To": [
                        {
                            "Email": to_email,
                            "Name": to_email
                        }
                    ],
                    "Subject": "Jelszó visszaállítás",
                    "TextPart": f"Kattints a linkre a jelszó visszaállításához: {reset_link}",
                    "HTMLPart": f"<h3>Jelszó visszaállítás</h3><a href='{reset_link}'>Kattints ide a jelszó visszaállításához</a>"
                }
            ]
        }
        result = mailjet.send.create(data=data)
        return result.status_code, result.json()

    def process_forgot_password(self, email: str):
        """
        Ha létezik a felhasználó, generál token-t, elmenti, és elküldi e-mailben.
        Ha nincs ilyen e-mail, hibát ad vissza.

        Visszatérés:
            (success: bool, message: str)
        """
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            return False, "Nincs ilyen e-mail cím regisztrálva."

        reset_token = str(uuid.uuid4())
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        self.db.commit()

        status, resp = self.send_reset_email(user.email, reset_token)
        if status != 200:
            return False, f"E-mail küldési hiba: {resp}"

        return True, "Elküldtük a jelszó-visszaállító e-mailt."
