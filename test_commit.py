from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from backend.models import Subscription, User
from backend.database import DATABASE_URL
from dateutil.relativedelta import relativedelta

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_commit():
    db = SessionLocal()
    try:
        sub = db.query(Subscription).first()
        if not sub:
            print("No subs found")
            return
            
        print(f"Before: {sub.next_billing_date}")
        sub.next_billing_date = sub.next_billing_date + relativedelta(months=1)
        print(f"After modification (before commit): {sub.next_billing_date}")
        db.commit()
        db.refresh(sub)
        print(f"After commit: {sub.next_billing_date}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_commit()
