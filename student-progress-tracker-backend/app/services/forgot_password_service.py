import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import uuid
from app.db.models import User
from mailjet_rest import Client

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
        api_key = os.getenv("MAILJET_API_KEY", "8500664c47d6156ee0ba18594fdd88c6")
        api_secret = os.getenv("MAILJET_API_SECRET", "c9327b1703b7e2eb1ab59ebea33cad27")
        mailjet = Client(auth=(api_key, api_secret), version='v3.1')
        reset_link = f"http://enaploproject.ddns.net/reset-password?token={reset_token}"
        data = {
            'Messages': [
                {
                    "From": {
                        "Email": "enaploproject@gmail.com",
                        "Name": "Enaplo Project"
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

        Returns:
            (success: bool, message: str)
        """
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            return False, "Nincs ilyen e-mail cím regisztrálva."

        # Token generálás és mentés
        reset_token = str(uuid.uuid4())
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)  # 1 óra érvényesség
        self.db.commit()

        # E-mail küldés Mailjettel
        status, resp = self.send_reset_email(user.email, reset_token)
        if status != 200:
            return False, f"E-mail küldési hiba: {resp}"

        return True, "Elküldtük a jelszó-visszaállító e-mailt."