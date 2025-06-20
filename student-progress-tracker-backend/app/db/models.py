from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
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
    role = Column(Enum('user', 'admin'), default='user')
    created_at = Column(DateTime)

    progress = relationship("Progress", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    credit = Column(Integer, nullable=False)
    recommended_semester = Column(Integer, nullable=False)

    progress = relationship("Progress", back_populates="course")

class Progress(Base):
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
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    major = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime)
    anonymous = Column(Boolean, default=False)

    user = relationship("User", back_populates="chat_messages")