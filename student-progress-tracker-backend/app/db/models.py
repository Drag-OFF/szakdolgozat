"""
SQLAlchemy ORM modellek: felhasználók, kurzusok, szakok, előrehaladás, chat, követelmény-szabályok.

A ``User.major`` szöveges mező a ``majors.name`` értékével egyezik (nincs fix enum a kódban).
"""
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, Enum, ForeignKey, UniqueConstraint
from datetime import datetime
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy.sql import func
from sqlalchemy import JSON

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
        major (ENUM): Szak.
        verified (bool): E-mail verifikáció státusz.
        verify_token (str): E-mail verifikációs token.
        reset_token (str): Jelszó-visszaállító token.
        reset_token_expires (datetime): Jelszó-visszaállító token lejárati ideje.
        role (str): Szerepkör (user/admin).
        created_at (datetime): Létrehozás ideje.
        anonymous_name (str): Névtelen üzenetekhez használt név.
        major (str): Szak megnevezése; dinamikusan a ``majors`` táblából, admin által bővíthető.
        chosen_specialization_code (Optional[str]): MK specializáció (pl. MK-S-MA) vagy NONE jellegű sentinel, ha nincs ág.
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
    major = Column(String(255), nullable=False)
    chosen_specialization_code = Column(String(80), nullable=True)
    verified = Column(Boolean, default=False)
    verify_token = Column(String(255), nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    role = Column(Enum('user', 'admin'), default='user')
    created_at = Column(DateTime, nullable=False, default=func.now())
    anonymous_name = Column(String(32), unique=True, nullable=True)

    progress = relationship("Progress", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")

class Course(Base):
    """
    Kurzus adatbázis modell.

    Attributes:
        id (int): Kurzus azonosító.
        course_code (str): Kurzus kódja.
        name (str): Kurzus neve.
        name_en (str): Kurzus neve angolul.

    """
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=True)

    progress = relationship("Progress", back_populates="course")

class Major(Base):
    """
    Szak adatbázis modell.

    Attributes:
        id (int): Szak azonosító.
        name (str): Szak neve magyarul (belső/kulcs érték).
        name_en (str): Szak neve angolul.
    """
    __tablename__ = "majors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    name_en = Column(String(255), nullable=True)

class MajorRequirementRule(Base):
    """
    Dinamikus szak-követelmény szabály (egy szakhoz több sor: info/matek/fizika bontás stb.).

    Attributes:
        requirement_type: ``required`` / ``elective`` / ``optional`` / ``pe`` / ``practice`` jelleg.
        subgroup: Egyedi kulcs, amire a ``course_major.subgroup`` hivatkozhat (pl. ``elective_info_credits``).
        parent_rule_code: Rollup szülő kódja; a gyerek szabály kreditjei a főcsoportba számítanak.
            A ``course_major.subgroup`` továbbra is a levél szabály kódjára mutat.
        value_type: ``credits``, ``count`` vagy ``hours`` - a ``min_value`` mértéke.
        is_specialization_root: Ha igaz, ez a szabály egy kölcsönösen kizáró specializációs fa gyökere
            (hallgatói választó + NONE szűrés); a kód prefixe tetszőleges (MK-S-*, SP-*, stb.).
    """
    __tablename__ = "major_requirement_rules"

    id = Column(Integer, primary_key=True, index=True)
    major_id = Column(Integer, ForeignKey("majors.id"), nullable=False, index=True)
    code = Column(String(80), nullable=False)
    label_hu = Column(String(255), nullable=False)
    label_en = Column(String(255), nullable=True)
    requirement_type = Column(String(50), nullable=False)
    subgroup = Column(String(80), nullable=True)
    parent_rule_code = Column(String(80), nullable=True)
    value_type = Column(String(20), nullable=False, default="credits")
    min_value = Column(Integer, nullable=False, default=0)
    include_in_total = Column(Boolean, nullable=False, default=True)
    is_specialization_root = Column(Boolean, nullable=False, default=False)

class CourseMajor(Base):
    """
    Kurzus-szak kapcsolat modell.

    Attributes:
        id (int): Kapcsolat azonosító.
        course_id (int): Kurzus azonosító.
        major_id (int): Szak azonosító.
        credit (int): Kredit.
        semester (int): Ajánlott félév.
        type (str): Típus (pl. kötelező/választható).
        subgroup (str): Alcsoport (lehet NULL).
    """
    __tablename__ = "course_major"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    major_id = Column(Integer, ForeignKey("majors.id"), nullable=False)
    credit = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    type = Column(String(50), nullable=False)
    subgroup = Column(String(50), nullable=True)

class CourseEquivalence(Base):
    """
    Kurzus ekvivalencia modell.

    Attributes:
        id (int): Ekvivalencia azonosító.
        course_id (int): Kurzus azonosító.
        equivalent_course_id (int): Ekvivalens kurzus azonosító.
        major_id (int): Szak azonosító.
    """
    __tablename__ = "course_equivalence"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    equivalent_course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    major_id = Column(Integer, ForeignKey("majors.id", ondelete="CASCADE"), nullable=False)

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
        anonymous_name (str): Névtelen üzenetnél megjelenő név.
        reply_to_id (int): Az azonosítója annak az üzenetnek, amire válaszol (ha van).
        reply_to (ChatMessage): Az üzenet, amire válaszol (ha van).
        user (User): Az üzenet szerzője.
        reactions (List[ChatReaction]): Az üzenethez tartozó reakciók.
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    major = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime)
    anonymous = Column(Boolean, default=False)
    anonymous_name = Column(String(32), nullable=True)
    reply_to_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=True)
    reply_to = relationship("ChatMessage", remote_side=[id], uselist=False)
    user = relationship("User", back_populates="chat_messages")
    reactions = relationship("ChatReaction", back_populates="message", cascade="all, delete-orphan")

class ChatReaction(Base):
    """
    Egy reakció egy üzenethez. Egy felhasználó csak egy reakciót adhat egy üzenetre.

    Attributes:
        id (int): Reakció azonosító.
        message_id (int): Az üzenet azonosítója, amelyhez a reakció tartozik.
        user_id (int): A reakciót adó felhasználó azonosítója.
        emoji (str): Az emoji karakter.
        created_at (datetime): A reakció létrehozásának ideje.
    """
    __tablename__ = "chat_reaction"
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    emoji = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("message_id", "user_id", name="unique_reaction_per_user_per_message"),)

    message = relationship("ChatMessage", back_populates="reactions")
