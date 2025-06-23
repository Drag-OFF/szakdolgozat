from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db import models, schemas
from app.db.database import get_db
from app.services.chat_service import ChatService

router = APIRouter()

@router.post("/messages/", response_model=schemas.ChatMessage)
def send_message(message: schemas.ChatMessageCreate, db: Session = Depends(get_db)):
    """
    Üzenet küldése.

    Args:
        message (schemas.ChatMessageCreate): A küldendő üzenet.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.ChatMessage: A létrehozott üzenet.
    
    Raises:
        HTTPException: Ha az üzenet nem jöhetett létre.
    """
    chat_service = ChatService(db)
    try:
        return chat_service.create_message(message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/messages/", response_model=list[schemas.ChatMessage])
def get_messages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Üzenetek lekérése.

    Args:
        skip (int): Az üzenetek, amelyeket átugrunk.
        limit (int): A maximális üzenetszám, amelyet visszaadunk.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        list[schemas.ChatMessage]: Az üzenetek listája.
    """
    chat_service = ChatService(db)
    messages = chat_service.get_messages(skip=skip, limit=limit)
    return messages

@router.get("/messages/{message_id}", response_model=schemas.ChatMessage)
def get_message(message_id: int, db: Session = Depends(get_db)):
    """
    Egy adott üzenet lekérése az ID alapján.

    Args:
        message_id (int): Az üzenet azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.ChatMessage: A kért üzenet.

    Raises:
        HTTPException: Ha az üzenet nem található.
    """
    chat_service = ChatService(db)
    message = chat_service.get_message(message_id)
    if message is None:
        raise HTTPException(status_code=404, detail="Üzenet nem található")
    return message