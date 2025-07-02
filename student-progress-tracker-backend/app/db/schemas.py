from pydantic import BaseModel, validator, EmailStr, Field
import re
from datetime import datetime
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class MajorEnum(str, Enum):
    gazdasag = "Gazdaságinformatikus"
    mernoki = "Mérnökinformatikus"
    programtervezo = "Programtervező informatikus"
    villamos = "Villamosmérnök"
    uzemmernok = "Üzemmérnök-informatikus"

class UserBase(BaseModel):
    """
    Felhasználó alap séma.

    Attributes:
        uid (str): NEPTUN kód.
        email (str): E-mail cím.
        name (str): Név.
        birth_date (date): Születési dátum.
        id_card_number (str): Személyi igazolvány szám.
        address_card_number (str): Lakcímkártya szám.
        mothers_name (str): Anyja neve.
        major (MajorEnum): Szak.
        verified (bool): E-mail verifikáció.
        role (str): Szerepkör.
        created_at (datetime): Létrehozás ideje.
    """
    uid: str
    email: str
    name: str
    birth_date: date
    id_card_number: str
    address_card_number: str
    mothers_name: str
    major: MajorEnum
    verified: bool
    role: str
    created_at: datetime

class UserCreate(BaseModel):
    """
    Felhasználó létrehozási séma.

    Attributes:
        uid (str): NEPTUN kód.
        email (str): E-mail cím.
        password (str): Jelszó.
        name (str): Név.
        birth_date (date): Születési dátum.
        id_card_number (str): Személyi igazolvány szám.
        address_card_number (str): Lakcímkártya szám.
        mothers_name (str): Anyja neve.
        major (MajorEnum): Szak.
    """
    uid: str
    email: str
    password: str
    name: str
    birth_date: date
    id_card_number: str
    address_card_number: str
    mothers_name: str
    major: MajorEnum

    @validator('uid')
    def validate_uid(cls, v):
        v = v.upper()
        if not re.fullmatch(r'[A-Z0-9]{1,6}', v):
            raise ValueError('A NEPTUN kód maximum 6 karakter, csak betű és szám lehet!')
        return v

    @validator('name')
    def validate_name(cls, v):
        if ' ' not in v.strip():
            raise ValueError('Kérjük, adja meg a teljes nevét (vezetéknév és keresztnév)!')
        return v

    @validator('birth_date')
    def validate_birth_date(cls, v):
        if v > date.today():
            raise ValueError('A születési dátum nem lehet a jövőben!')
        return v

    @validator('id_card_number', 'address_card_number')
    def validate_card_number(cls, v):
        v = v.upper()
        if not re.fullmatch(r'\d{6}[A-Z]{2}', v):
            raise ValueError('A szám formátuma: 6 számjegy, majd 2 nagybetű (pl. 123456AB)')
        return v

    @validator('mothers_name')
    def validate_mothers_name(cls, v):
        if ' ' not in v.strip():
            raise ValueError('Kérjük, adja meg az anyja teljes nevét (vezetéknév és keresztnév)!')
        return v
    
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
        major (Optional[MajorEnum]): Szak.
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
    major: Optional[MajorEnum] = None
    verified: Optional[bool] = None
    role: Optional[str] = None
    created_at: Optional[datetime] = None
    password_hash: Optional[str] = None

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

class ForgotPasswordRequest(BaseModel):
    """
    Elfelejtett jelszó kérés séma.
    A felhasználó e-mail címét várja, amelyre a jelszó-visszaállító linket küldjük.
    """
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    """
    Elfelejtett jelszó válasz séma.
    Visszajelzést ad arról, hogy sikeres volt-e a kérés, illetve egy üzenetet is tartalmaz.
    """
    success: bool
    message: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=8)


class EmailRequest(BaseModel):
    email: str

class User(UserBase):
    """
    Felhasználó séma (adatbázisból visszaadott).

    Attributes:
        id (int): Felhasználó azonosító.
        (A többi mező a UserBase-ből öröklődik.)
    """
    id: int

    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    """
    Kurzus alap séma.

    Attributes:
        course_code (str): A kurzus kódja.
        name (str): A kurzus neve.
        credit (int): A kredit érték.
        recommended_semester (int): Az ajánlott félév.
        prerequisites (Optional[List[str]]): Előfeltétel(ek) kurzuskód(ok) listája.
        allow_parallel_prerequisite (Optional[bool]): Engedélyezett-e a párhuzamos teljesítés.
    """
    course_code: str
    name: str
    credit: int
    recommended_semester: int
    prerequisites: Optional[List[str]] = None
    allow_parallel_prerequisite: Optional[bool] = False

class CourseCreate(CourseBase):
    """
    Kurzus létrehozási séma.

    Attributes:
        course_code (str): A kurzus kódja.
        name (str): A kurzus neve.
        credit (int): A kredit érték.
        recommended_semester (int): Az ajánlott félév.
        prerequisites (Optional[List[str]]): Előfeltétel(ek) kurzuskód(ok) listája.
        allow_parallel_prerequisite (Optional[bool]): Engedélyezett-e a párhuzamos teljesítés.
    """
    course_code: str
    name: str
    credit: int
    recommended_semester: int
    prerequisites: Optional[List[str]] = None
    allow_parallel_prerequisite: Optional[bool] = False

class CourseUpdate(BaseModel):
    """
    Kurzus frissítési séma.

    Attributes:
        course_code (Optional[str]): A kurzus kódja.
        name (Optional[str]): A kurzus neve.
        credit (Optional[int]): A kredit érték.
        recommended_semester (Optional[int]): Az ajánlott félév.
        prerequisites (Optional[List[str]]): Előfeltétel(ek) kurzuskód(ok) listája.
        allow_parallel_prerequisite (Optional[bool]): Engedélyezett-e a párhuzamos teljesítés.
    """
    course_code: Optional[str] = None
    name: Optional[str] = None
    credit: Optional[int] = None
    recommended_semester: Optional[int] = None
    prerequisites: Optional[List[str]] = None
    allow_parallel_prerequisite: Optional[bool] = None

class Course(CourseBase):
    """
    Kurzus séma (adatbázisból visszaadott).

    Attributes:
        id (int): Kurzus azonosító.
        (A többi mező a CourseBase-ből öröklődik.)
    """
    id: int

    class Config:
        from_attributes = True

class ProgressBase(BaseModel):
    """
    Haladás alap séma.

    Attributes:
        user_id (int): Felhasználó ID.
        course_id (int): Kurzus ID.
        completed_semester (Optional[int]): Teljesített félév.
        status (str): Állapot.
        points (int): Pontszám.
    """
    user_id: int
    course_id: int
    completed_semester: Optional[int]
    status: str
    points: int

class ProgressCreate(ProgressBase):
    """
    Haladás létrehozási séma.

    Attributes:
        user_id (int): Felhasználó ID.
        course_id (int): Kurzus ID.
        completed_semester (Optional[int]): Teljesített félév.
        status (str): Állapot.
        points (int): Pontszám.
    """
    user_id: int
    course_id: int
    completed_semester: Optional[int]
    status: str
    points: int

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
    """
    Haladás séma (adatbázisból visszaadott).

    Attributes:
        id (int): Haladás azonosító.
        (A többi mező a ProgressBase-ből öröklődik.)
    """
    id: int

    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    """
    Chat üzenet alap séma.

    Attributes:
        major (str): Szak.
        user_id (Optional[int]): Felhasználó ID.
        message (str): Üzenet.
        timestamp (datetime): Időbélyeg.
        anonymous (bool): Névtelen-e.
    """
    major: str
    user_id: Optional[int]
    message: str
    timestamp: datetime
    anonymous: bool

class ChatUser(BaseModel):
    name: str
    neptun: str
    role: str

class ChatMessageCreate(ChatMessageBase):
    """
    Chat üzenet létrehozási séma.

    Attributes:
        major (str): Szak.
        user_id (Optional[int]): Felhasználó ID.
        message (str): Üzenet.
        timestamp (datetime): Időbélyeg.
        anonymous (bool): Névtelen-e.
    """
    major: str
    user_id: Optional[int]
    message: str
    timestamp: datetime
    anonymous: bool

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
    """
    Chat üzenet séma (adatbázisból visszaadott).

    Attributes:
        id (int): Üzenet azonosító.
        (A többi mező a ChatMessageBase-ből öröklődik.)
    """
    id: int

    class Config:
        from_attributes = True

class ChatMessageOut(BaseModel):
    """
    Chat üzenet válasz séma (megjelenítéshez).

    Attributes:
        id (int): Üzenet azonosító.
        major (str): Szak.
        user_id (Optional[int]): Felhasználó ID.
        message (str): Üzenet.
        timestamp (datetime): Időbélyeg.
        anonymous (bool): Névtelen-e.
        display_name (str): Megjelenítendő név (név vagy anonymous_name).
        display_neptun (Optional[str]): Megjelenítendő neptun kód (ha nem anonim).
    """
    id: int
    major: str
    user_id: Optional[int]
    message: str
    timestamp: datetime
    anonymous: bool
    display_name: str
    display_neptun: Optional[str]

    class Config:
        from_attributes = True

class ChatReactionBase(BaseModel):
    emoji: str

class ChatReactionCreate(ChatReactionBase):
    message_id: int

class ChatReactionOut(ChatReactionBase):
    id: int
    message_id: int
    user_id: int
    created_at: datetime
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