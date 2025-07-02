from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db import schemas
from app.db.database import get_db
from app.services.chat_service import ChatService
from app.utils import get_current_user
from app.db.models import User

router = APIRouter()

@router.post("/messages/", response_model=schemas.ChatMessage, dependencies=[Depends(get_current_user)])
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

@router.get("/messages/", response_model=list[schemas.ChatMessageOut], dependencies=[Depends(get_current_user)])
def get_messages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Üzenetek lekérése.

    Args:
        skip (int): Az üzenetek, amelyeket átugrunk.
        limit (int): A maximális üzenetszám, amelyet visszaadunk.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        list[schemas.ChatMessageOut]: Az üzenetek listája, megjelenítendő névvel és neptun kóddal.
    """
    chat_service = ChatService(db)
    messages = chat_service.get_messages(skip=skip, limit=limit)
    result = []
    for msg in messages:
        if msg.anonymous:
            display_name = msg.anonymous_name or "Anon"
            display_neptun = None
        else:
            user = db.query(User).filter(User.id == msg.user_id).first()
            display_name = user.name if user else "Ismeretlen"
            display_neptun = user.uid if user else None
        result.append(
            schemas.ChatMessageOut(
                id=msg.id,
                major=msg.major,
                user_id=msg.user_id,
                message=msg.message,
                timestamp=msg.timestamp,
                anonymous=msg.anonymous,
                display_name=display_name,
                display_neptun=display_neptun,
            )
        )
    return result

@router.get("/messages/{message_id}", response_model=schemas.ChatMessageOut)
def get_message(message_id: int, db: Session = Depends(get_db)):
    """
    Egy adott üzenet lekérése az ID alapján.

    Args:
        message_id (int): Az üzenet azonosítója.
        db (Session): Az adatbázis kapcsolat.

    Returns:
        schemas.ChatMessageOut: A kért üzenet, megjelenítendő névvel és neptun kóddal.

    Raises:
        HTTPException: Ha az üzenet nem található.
    """
    chat_service = ChatService(db)
    msg = chat_service.get_message(message_id)
    if msg is None:
        raise HTTPException(status_code=404, detail="Üzenet nem található")
    if msg.anonymous:
        display_name = msg.anonymous_name or "Anon"
        display_neptun = None
    else:
        user = db.query(User).filter(User.id == msg.user_id).first()
        display_name = user.name if user else "Ismeretlen"
        display_neptun = user.uid if user else None
    return schemas.ChatMessageOut(
        id=msg.id,
        major=msg.major,
        user_id=msg.user_id,
        message=msg.message,
        timestamp=msg.timestamp,
        anonymous=msg.anonymous,
        display_name=display_name,
        display_neptun=display_neptun,
    )