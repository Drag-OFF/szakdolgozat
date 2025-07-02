from sqlalchemy.orm import Session
from app.db.models import ChatMessage, ChatReaction
from app.db.schemas import ChatMessageCreate
from fastapi import HTTPException
import random

class ChatService:
    def __init__(self, db: Session):
        self.db = db

    def generate_anon_name(self, user_id: int) -> str:
        """
        Egyedi anonim név generálása egy felhasználónak.

        Args:
            user_id (int): Felhasználó azonosító.

        Returns:
            str: Egyedi anonim név (pl. Anon#1234).
        """
        return f"Anon#{user_id}{random.randint(100,999)}"

    def create_message(self, message: ChatMessageCreate) -> ChatMessage:
        """
        Üzenet létrehozása.

        Args:
            message (ChatMessageCreate): Az üzenet, amelyet létre kell hozni.

        Returns:
            ChatMessage: A létrehozott üzenet.

        Raises:
            HTTPException: Ha az üzenet nem hozható létre.
        """
        data = message.dict()
        if data.get("anonymous"):
            data["anonymous_name"] = self.generate_anon_name(data.get("user_id") or 0)
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

        Args:
            skip (int): Az üzenetek, amelyeket át kell ugrani.
            limit (int): A visszaadandó üzenetek maximális száma.

        Returns:
            list[ChatMessage]: Az üzenetek listája.
        """
        return self.db.query(ChatMessage).offset(skip).limit(limit).all()

    def get_message(self, message_id: int) -> ChatMessage:
        """
        Egy adott üzenet lekérése az ID alapján.

        Args:
            message_id (int): Az üzenet ID-ja.

        Returns:
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

        Args:
            message_id (int): Az üzenet azonosítója.
            user_id (int): A felhasználó azonosítója.
            emoji (str): Az emoji karakter.

        Returns:
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

        Args:
            message_id (int): Az üzenet azonosítója.

        Returns:
            list[ChatReaction]: A reakciók listája.
        """
        return self.db.query(ChatReaction).filter_by(message_id=message_id).all()