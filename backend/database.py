import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# PostgreSQL connection using the provided credentials
# Format: postgresql://username:password@host:port/database_name
# You must create the 'smartspend' database beforehand.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:9492@localhost:5432/smartspend")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
