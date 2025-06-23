from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Adatbázis csatlakozásának URL-je
DATABASE_URL = "mysql+pymysql://root:@localhost/database"

# SQLAlchemy engine létrehozása
engine = create_engine(DATABASE_URL)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for declarative models
Base = declarative_base()

def get_db():
    """
    Adatbázis kapcsolat létrehozása.

    Visszaad egy adatbázis session-t, amelyet a hívó funkciók használhatnak.

    Returns:
        Session: Az adatbázis session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()