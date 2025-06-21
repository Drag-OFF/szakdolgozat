from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy.sql import func


class User(Base):
    """
    Felhasználó adatbázis modell.

    Attributes:
        id (int): Felhasználó azonosító.
        uid (str): NEPTUN kód.
        email (str): E-mail cím.
        password_hash (str): Jelszó hash.
        name (str): Név.
        birth_date (date): Születési dátum.
        id_card_number (str): Személyi igazolvány szám.
        address_card_number (str): Lakcímkártya szám.
        mothers_name (str): Anyja neve.
        major (str): Szak.
        verified (bool): E-mail verifikáció státusz.
        verify_token (str): E-mail verifikációs token.
        role (str): Szerepkör (user/admin).
        created_at (datetime): Létrehozás ideje.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String(64), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    name = Column(String(100), nullable=False)
    birth_date = Column(Date, nullable=False)
    id_card_number = Column(String(20), nullable=False)
    address_card_number = Column(String(20), nullable=False)
    mothers_name = Column(String(100), nullable=False)
    major = Column(String(100), nullable=False)
    verified = Column(Boolean, default=False)
    verify_token = Column(String(255), nullable=True)
    role = Column(Enum('user', 'admin'), default='user')
    created_at = Column(DateTime, nullable=False, default=func.now())

    progress = relationship("Progress", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")

class Course(Base):
    """
    Kurzus adatbázis modell.

    Attributes:
        id (int): Kurzus azonosító.
        course_code (str): Kurzus kódja.
        name (str): Kurzus neve.
        credit (int): Kredit érték.
        recommended_semester (int): Ajánlott félév.
    """
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    credit = Column(Integer, nullable=False)
    recommended_semester = Column(Integer, nullable=False)

    progress = relationship("Progress", back_populates="course")

class Progress(Base):
    """
    Haladás adatbázis modell.

    Attributes:
        id (int): Haladás azonosító.
        user_id (int): Felhasználó azonosító.
        course_id (int): Kurzus azonosító.
        completed_semester (int): Teljesített félév.
        status (str): Állapot (completed/in_progress/pending).
        points (int): Pontszám.
    """
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    completed_semester = Column(Integer)
    status = Column(Enum('completed', 'in_progress', 'pending'), nullable=False)
    points = Column(Integer, nullable=False)

    user = relationship("User", back_populates="progress")
    course = relationship("Course", back_populates="progress")

class ChatMessage(Base):
    """
    Chat üzenet adatbázis modell.

    Attributes:
        id (int): Üzenet azonosító.
        major (str): Szak.
        user_id (int): Felhasználó azonosító.
        message (str): Üzenet szövege.
        timestamp (datetime): Időbélyeg.
        anonymous (bool): Névtelen-e az üzenet.
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    major = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime)
    anonymous = Column(Boolean, default=False)

    user = relationship("User", back_populates="chat_messages")