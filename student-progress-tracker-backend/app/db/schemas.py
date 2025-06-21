from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class UserBase(BaseModel):
    uid: str
    email: str
    name: str
    birth_date: date
    id_card_number: str
    address_card_number: str
    mothers_name: str
    major: str
    verified: bool
    role: str
    created_at: datetime

class UserCreate(BaseModel):
    uid: str
    email: str
    password_hash: str
    name: str
    birth_date: date
    id_card_number: str
    address_card_number: str
    mothers_name: str
    major: str

class UserLogin(BaseModel):
    """
    Bejelentkezési séma. Lehetőség van e-mail vagy NEPTUN azonosító használatára.

    Attributes:
        email (Optional[str]): A felhasználó e-mail címe (nem kötelező).
        uid (Optional[str]): A felhasználó NEPTUN azonosítója (nem kötelező).
        password (str): A felhasználó jelszava.
    """
    email: Optional[str] = None
    uid: Optional[str] = None
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    """
    Felhasználó frissítési séma.

    Attributes:
        uid (Optional[str]): NEPTUN azonosító.
        email (Optional[str]): E-mail cím.
        name (Optional[str]): Név.
        birth_date (Optional[date]): Születési dátum.
        id_card_number (Optional[str]): Személyi igazolvány szám.
        address_card_number (Optional[str]): Lakcímkártya szám.
        mothers_name (Optional[str]): Anyja neve.
        major (Optional[str]): Szak.
        verified (Optional[bool]): E-mail verifikáció.
        role (Optional[str]): Szerepkör.
        created_at (Optional[datetime]): Létrehozás ideje.
        password_hash (Optional[str]): Jelszó hash.
    """
    uid: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    birth_date: Optional[date] = None
    id_card_number: Optional[str] = None
    address_card_number: Optional[str] = None
    mothers_name: Optional[str] = None
    major: Optional[str] = None
    verified: Optional[bool] = None
    role: Optional[str] = None
    created_at: Optional[datetime] = None
    password_hash: Optional[str] = None

class CourseBase(BaseModel):
    course_code: str
    name: str
    credit: int
    recommended_semester: int

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: int

    class Config:
        from_attributes = True

class ProgressBase(BaseModel):
    user_id: int
    course_id: int
    completed_semester: Optional[int]
    status: str
    points: int

class ProgressCreate(ProgressBase):
    pass

class ProgressUpdate(BaseModel):
    """
    Haladás frissítési séma.

    Attributes:
        user_id (Optional[int]): Felhasználó ID.
        course_id (Optional[int]): Kurzus ID.
        completed_semester (Optional[int]): Teljesített félév.
        status (Optional[str]): Állapot.
        points (Optional[int]): Pontszám.
    """
    user_id: Optional[int] = None
    course_id: Optional[int] = None
    completed_semester: Optional[int] = None
    status: Optional[str] = None
    points: Optional[int] = None

class Progress(ProgressBase):
    id: int

    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    major: str
    user_id: Optional[int]
    message: str
    timestamp: datetime
    anonymous: bool

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageUpdate(BaseModel):
    """
    Chat üzenet frissítési séma.

    Attributes:
        major (Optional[str]): Szak.
        user_id (Optional[int]): Felhasználó ID.
        message (Optional[str]): Üzenet.
        timestamp (Optional[datetime]): Időbélyeg.
        anonymous (Optional[bool]): Névtelen-e.
    """
    major: Optional[str] = None
    user_id: Optional[int] = None
    message: Optional[str] = None
    timestamp: Optional[datetime] = None
    anonymous: Optional[bool] = None

class ChatMessage(ChatMessageBase):
    id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    """
    Token séma, amely a bejelentkezés után visszaadott JWT vagy session tokent tartalmazza.

    Attributes:
        access_token (str): A hozzáférési token.
        token_type (str): A token típusa (pl. "bearer").
    """
    access_token: str
    token_type: str

class CourseUpdate(BaseModel):
    """
    Kurzus frissítési séma.

    Attributes:
        course_code (Optional[str]): A kurzus kódja.
        name (Optional[str]): A kurzus neve.
        credit (Optional[int]): A kredit érték.
        recommended_semester (Optional[int]): Az ajánlott félév.
    """
    course_code: Optional[str] = None
    name: Optional[str] = None
    credit: Optional[int] = None
    recommended_semester: Optional[int] = None