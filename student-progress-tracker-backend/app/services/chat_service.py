"""Chat üzenetek és reakciók perzisztencia — ``ChatService``."""

from sqlalchemy.orm import Session
from app.db.models import ChatMessage, ChatReaction, User
from app.db.schemas import ChatMessageCreate
from fastapi import HTTPException
import random

class ChatService:
    def __init__(self, db: Session):
        self.db = db

    def generate_anon_name(self, user_id: int) -> str:
        """
        Egyedi anonim név generálása egy felhasználónak.

        Paraméterek:
            user_id (int): Felhasználó azonosító.

        Visszatérés:
            str: Egyedi anonim név (pl. Anon#1234).
        """
        return f"Anon#{user_id}{random.randint(100,999)}"

    def create_message(self, message: ChatMessageCreate) -> ChatMessage:
        """
        Új chat üzenet létrehozása.

        Ha az üzenet anonim, a felhasználóhoz tartozó anonim nevet használja.
        Ha a felhasználónak még nincs anonim neve, generál egyet, elmenti a users táblába,
        és azt használja minden további anonim üzenethez.

        Paraméterek:
            message (ChatMessageCreate): Az üzenet adatai (szöveg, user_id, anonim flag stb.).

        Visszatérés:
            ChatMessage: A létrehozott üzenet adatbázis objektuma.

        Raises:
            HTTPException: Ha a felhasználó nem található.
        """
        data = message.dict()
        if data.get("anonymous"):
            user = self.db.query(User).filter(User.id == data.get("user_id")).first()
            if user is None:
                raise HTTPException(status_code=404, detail="User not found")
            if not user.anonymous_name:
                while True:
                    new_name = self.generate_anon_name(user.id)
                    if not self.db.query(User).filter(User.anonymous_name == new_name).first():
                        break
                user.anonymous_name = new_name
                self.db.commit()
            data["anonymous_name"] = user.anonymous_name
        else:
            data["anonymous_name"] = None
        db_message = ChatMessage(**data)
        self.db.add(db_message)
        self.db.commit()
        self.db.refresh(db_message)
        return db_message

    def get_messages(self, skip: int = 0, limit: int = 100) -> list[ChatMessage]:
        """
        Üzenetek lekérése.

        Paraméterek:
            skip (int): Az üzenetek, amelyeket át kell ugrani.
            limit (int): A visszaadandó üzenetek maximális száma.

        Visszatérés:
            list[ChatMessage]: Az üzenetek listája.
        """
        return self.db.query(ChatMessage).offset(skip).limit(limit).all()

    def get_message(self, message_id: int) -> ChatMessage:
        """
        Egy adott üzenet lekérése az ID alapján.

        Paraméterek:
            message_id (int): Az üzenet ID-ja.

        Visszatérés:
            ChatMessage: A kért üzenet.

        Raises:
            HTTPException: Ha az üzenet nem található.
        """
        message = self.db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
        if message is None:
            raise HTTPException(status_code=404, detail="Message not found")
        return message
    
    def add_or_update_reaction(self, message_id: int, user_id: int, emoji: str) -> ChatReaction:
        """
        Egy reakció hozzáadása vagy frissítése egy üzenethez.

        Ha a felhasználó már reagált erre az üzenetre, a reakció emoji frissül.
        Ha még nem reagált, új reakció jön létre.

        Paraméterek:
            message_id (int): Az üzenet azonosítója.
            user_id (int): A felhasználó azonosítója.
            emoji (str): Az emoji karakter.

        Visszatérés:
            ChatReaction: A létrehozott vagy frissített reakció.
        """
        print(f"add_or_update_reaction: message_id={message_id}, user_id={user_id}, emoji={emoji}")
        reaction = (
            self.db.query(ChatReaction)
            .filter_by(message_id=message_id, user_id=user_id)
            .first()
        )
        if reaction:
            reaction.emoji = emoji
        else:
            reaction = ChatReaction(message_id=message_id, user_id=user_id, emoji=emoji)
            self.db.add(reaction)
        self.db.commit()
        self.db.refresh(reaction)
        return reaction

    def get_reactions_for_message(self, message_id: int) -> list[ChatReaction]:
        """
        Egy üzenethez tartozó összes reakció lekérése.

        Paraméterek:
            message_id (int): Az üzenet azonosítója.

        Visszatérés:
            list[ChatReaction]: A reakciók listája.
        """
        return self.db.query(ChatReaction).filter_by(message_id=message_id).all()
