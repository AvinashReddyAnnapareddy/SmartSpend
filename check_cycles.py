from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from backend.models import Subscription
from backend.database import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_cycles():
    db = SessionLocal()
    try:
        subs = db.query(Subscription).all()
        for sub in subs:
            print(f"ID: {sub.id}, Name: {sub.name}, Cycle: '{sub.billing_cycle}'")
    finally:
        db.close()

if __name__ == "__main__":
    check_cycles()
