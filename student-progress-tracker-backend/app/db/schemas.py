from pydantic import BaseModel, ConfigDict, validator, EmailStr, Field
from typing import Optional, List
import re
from datetime import date, datetime
from enum import Enum

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
        major (str): Szak (dinamikusan a `majors` táblából).
        verified (bool): E-mail verifikáció.
        role (str): Szerepkör.
        created_at (datetime): Létrehozás ideje.
        anonymous_name (Optional[str]): Anonim név, ha van.
    """
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
    anonymous_name: Optional[str] = None

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
        major (str): Szak (dinamikusan a `majors` táblából).
    """
    uid: str
    email: str
    password: str
    name: str
    birth_date: date
    id_card_number: str
    address_card_number: str
    mothers_name: str
    major: str

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
        major (Optional[str]): Szak.
        verified (Optional[bool]): E-mail verifikáció.
        role (Optional[str]): Szerepkör.
        created_at (Optional[datetime]): Létrehozás ideje.
        password_hash (Optional[str]): Jelszó hash.
        anonymous_name (Optional[str]): Anonim név, ha van.
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
    anonymous_name: Optional[str] = None

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

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

class DeleteProfileRequest(BaseModel):
    password: str

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
        name_en (str): A kurzus neve angolul.
    """
    course_code: str
    name: Optional[str] = None
    name_en: Optional[str] = None

class CourseCreate(CourseBase):
    """
    Kurzus létrehozási séma.

    Attributes:
        course_code (str): A kurzus kódja.
        name (str): A kurzus neve.
    """
    course_code: str
    name: Optional[str] = None
    name_en: Optional[str] = None

class CourseUpdate(BaseModel):
    """
    Kurzus frissítési séma.

    Attributes:
        course_code (Optional[str]): A kurzus kódja.
        name (Optional[str]): A kurzus neve.
        name_en (Optional[str]): A kurzus neve angolul.
    """
    course_code: Optional[str] = None
    name: Optional[str] = None
    name_en: Optional[str] = None

class Course(CourseBase):
    """
    Kurzus séma (adatbázisból visszaadott).

    Attributes:
        id (int): Kurzus azonosító.
        (A többi mező a CourseBase-ből öröklődik.)
    """
    id: int
    name_en: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class MajorBase(BaseModel):
    """
    Szak alap séma.

    Attributes:
        name (str): Szak neve magyarul (belső/kulcs érték).
        name_en (Optional[str]): Szak neve angolul.
    """
    name: str
    name_en: Optional[str] = None

class MajorCreate(MajorBase):
    """
    Szak létrehozási séma.
    """
    pass

class MajorUpdate(BaseModel):
    """
    Szak frissítési séma. Opcionális mezők: csak a módosítandó mezőket küldd.
    """
    name: Optional[str] = None
    name_en: Optional[str] = None

    # pydantic v2: ORM-objektumokból történő modellezés
    model_config = ConfigDict(from_attributes=True)

class Major(MajorBase):
    """
    Szak séma (adatbázisból visszaadott).

    Attributes:
        id (int): Szak azonosító.
        name (str): Szak neve magyarul.
        name_en (Optional[str]): Szak neve angolul.
    """
    id: int
    model_config = ConfigDict(from_attributes=True)

class MajorRequirementBase(BaseModel):
    """
    Szak követelmény alap séma.

    Attributes:
        major_id (int): Szak azonosító.
        total_credits (int): Összes kredit.
        required_credits (int): Kötelező kredit.
        elective_credits (int): Kötelezően választható kredit.
        optional_credits (int): Szabadon választható kredit.
        elective_info_credits (int): Informatikai törzsanyag kredit.
        elective_math_credits (int): Matematikai törzsanyag kredit.
        pe_semesters (int): Testnevelés félévek.
        practice_hours (int): Szakmai gyakorlat órák.
        elective_non_core_credits (int): Kötelezően választható nem-törzs kredit.
        elective_core_credits (int): Kötelezően választható törzs kredit.
        thesis_credits (int): Szakdolgozat kreditek.
    """
    major_id: int
    total_credits: int
    required_credits: int
    elective_credits: int
    optional_credits: int

    elective_info_credits: int = 0
    elective_math_credits: int = 0
    pe_semesters: int = 0
    practice_hours: int = 0

    elective_non_core_credits: int = 0
    elective_core_credits: int = 0
    thesis_credits: int = 0

class MajorRequirementCreate(MajorRequirementBase):
    """
    Szak követelmény létrehozási séma.

    Attributes:
        major_id (int): Szak azonosító.
    """
    pass

class MajorRequirement(MajorRequirementBase):
    """
    Szak követelmény séma (adatbázisból visszaadott).

    Attributes:
        id (int): Követelmény azonosító.
        major_id (int): Szak azonosító.
    """
    id: int
    class Config:
        from_attributes = True

class MajorRequirementRuleBase(BaseModel):
    major_id: int
    code: str
    label_hu: str
    label_en: Optional[str] = None
    requirement_type: str
    subgroup: Optional[str] = None
    value_type: str = "credits"  # credits | count | hours
    min_value: int = 0
    include_in_total: bool = True

class MajorRequirementRuleCreate(MajorRequirementRuleBase):
    pass

class MajorRequirementRuleUpdate(BaseModel):
    code: Optional[str] = None
    label_hu: Optional[str] = None
    label_en: Optional[str] = None
    requirement_type: Optional[str] = None
    subgroup: Optional[str] = None
    value_type: Optional[str] = None
    min_value: Optional[int] = None
    include_in_total: Optional[bool] = None

class MajorRequirementRule(MajorRequirementRuleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class CourseMajorBase(BaseModel):
    """
    Kurzus-szak kapcsolat alap séma.

    Attributes:
        course_id (int): Kurzus azonosító.
        major_id (int): Szak azonosító.
        credit (int): Kredit érték.
        semester (int): Ajánlott félév.
        type (str): Típus (pl. kötelező/választható).
        subgroup (Optional[str]): Alcsoport (lehet None).
        prerequisites (Optional[str]): Előfeltételek (JSON vagy szöveg, lehet None).
    """
    course_id: int
    major_id: int
    credit: int
    semester: int
    type: str
    subgroup: Optional[str] = None
    prerequisites: Optional[str] = None

class CourseMajorCreate(CourseMajorBase):
    """
    Kurzus-szak kapcsolat létrehozási séma.

    Attributes:
        course_id (int): Kurzus azonosító.
        major_id (int): Szak azonosító.
        credit (int): Kredit érték.
        semester (int): Ajánlott félév.
        type (str): Típus.
        subgroup (Optional[str]): Alcsoport.
        prerequisites (Optional[str]): Előfeltételek.
    """
    pass

class CourseMajor(CourseMajorBase):
    """
    Kurzus-szak kapcsolat séma (adatbázisból visszaadott).

    Attributes:
        id (int): Kapcsolat azonosító.
        course_id (int): Kurzus azonosító.
        major_id (int): Szak azonosító.
        credit (int): Kredit érték.
        semester (int): Ajánlott félév.
        type (str): Típus.
        subgroup (Optional[str]): Alcsoport.
        prerequisites (Optional[str]): Előfeltételek.
    """
    id: int
    model_config = ConfigDict(from_attributes=True)

class CourseMajorUpdate(BaseModel):
    """
    Kurzus–szak kapcsolat frissítési séma.
    Minden mező opcionális, csak a módosítani kívánt mezőket küldd.
    """
    course_id: Optional[int] = None
    major_id: Optional[int] = None
    credit: Optional[int] = None
    semester: Optional[int] = None
    type: Optional[str] = None
    subgroup: Optional[str] = None
    prerequisites: Optional[str] = None

class CourseEquivalenceBase(BaseModel):
    """
    Kurzus ekvivalencia alap séma.

    Attributes:
        course_id (int): Kurzus azonosító.
        equivalent_course_id (int): Ekvivalens kurzus azonosító.
        major_id (int): Szak azonosító.
    """
    course_id: int
    equivalent_course_id: int
    major_id: int

class CourseEquivalenceCreate(CourseEquivalenceBase):
    """
    Kurzus ekvivalencia létrehozási séma.

    Attributes:
        course_id (int): Kurzus azonosító.
        equivalent_course_id (int): Ekvivalens kurzus azonosító.
        major_id (int): Szak azonosító.
    """
    pass

class CourseEquivalence(CourseEquivalenceBase):
    """
    Kurzus ekvivalencia séma (adatbázisból visszaadott).

    Attributes:
        id (int): Ekvivalencia azonosító.
        course_id (int): Kurzus azonosító.
        equivalent_course_id (int): Ekvivalens kurzus azonosító.
        major_id (int): Szak azonosító.
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

    model_config = ConfigDict(from_attributes=True)

class ProgressFull(BaseModel):
    id: int
    course_code: str
    course_name: str
    recommended_semester: int | None = None
    credit: int | None = None
    completed_semester: int | None = None
    status: str
    points: int | None = None
    category: str | None = None

    model_config = ConfigDict(from_attributes=True)

class ChatMessageBase(BaseModel):
    """
    Chat üzenet alap séma.

    Attributes:
        major (str): Szak.
        user_id (Optional[int]): Felhasználó ID.
        message (str): Üzenet.
        timestamp (datetime): Időbélyeg.
        anonymous (bool): Névtelen-e.
        reply_to_id (Optional[int]): Az üzenet, amire válaszol (ha van).
    """
    major: str
    user_id: Optional[int]
    message: str
    timestamp: datetime
    anonymous: bool
    reply_to_id: Optional[int] = None

class ChatUser(BaseModel):
    id: int
    name: str
    neptun: str
    role: str

class ChatLeaderboardUser(BaseModel):
    id: int
    name: str
    neptun: str
    points: int

class ChatMessageCreate(ChatMessageBase):
    """
    Chat üzenet létrehozási séma.

    Attributes:
        major (str): Szak.
        user_id (Optional[int]): Felhasználó ID.
        message (str): Üzenet.
        timestamp (datetime): Időbélyeg.
        anonymous (bool): Névtelen-e.
        reply_to_id (Optional[int]): Az üzenet, amire válaszol (ha van).
    """
    major: str
    user_id: Optional[int]
    message: str
    timestamp: datetime
    anonymous: bool
    reply_to_id: Optional[int] = None

class ChatMessageUpdate(BaseModel):
    """
    Chat üzenet frissítési séma.

    Attributes:
        major (Optional[str]): Szak.
        user_id (Optional[int]): Felhasználó ID.
        message (Optional[str]): Üzenet.
        timestamp (Optional[datetime]): Időbélyeg.
        anonymous (Optional[bool]): Névtelen-e.
        reply_to_id (Optional[int]): Az üzenet, amire válaszol (ha van).
    """
    major: Optional[str] = None
    user_id: Optional[int] = None
    message: Optional[str] = None
    timestamp: Optional[datetime] = None
    anonymous: Optional[bool] = None
    reply_to_id: Optional[int] = None

class ChatMessage(ChatMessageBase):
    """
    Chat üzenet séma (adatbázisból visszaadott).

    Attributes:
        id (int): Üzenet azonosító.
        (A többi mező a ChatMessageBase-ből öröklődik.)
    """
    id: int

    model_config = ConfigDict(from_attributes=True)

class ChatReactionBase(BaseModel):
    emoji: str

class ChatReactionCreate(ChatReactionBase):
    message_id: int

class ChatReactionOut(ChatReactionBase):
    id: int
    message_id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

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
        reply_to_id (Optional[int]): Az üzenet, amire válaszol (ha van).
        reactions (List[ChatReactionOut]): Reakciók.
    """
    id: int
    major: str
    user_id: Optional[int]
    message: str
    timestamp: datetime
    anonymous: bool
    display_name: str
    display_neptun: Optional[str]
    reply_to_id: Optional[int] = None
    reactions: List[ChatReactionOut] = []

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    """
    Token séma, amely a bejelentkezés után visszaadott JWT vagy session tokent tartalmazza.

    Attributes:
        access_token (str): A hozzáférési token.
        token_type (str): A token típusa (pl. "bearer").
    """
    access_token: str
    token_type: str
