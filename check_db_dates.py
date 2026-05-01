from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from backend.models import Subscription
from backend.database import DATABASE_URL
from dateutil.relativedelta import relativedelta

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_subs():
    db = SessionLocal()
    try:
        subs = db.query(Subscription).all()
        for sub in subs:
            print(f"ID: {sub.id}, Name: {sub.name}, Date: {sub.next_billing_date}, Type: {type(sub.next_billing_date)}")
            
            # test adding 1 month
            if sub.billing_cycle == 'MONTHLY':
                new_date = sub.next_billing_date + relativedelta(months=1)
                print(f"  New Date (if updated): {new_date}")
    finally:
        db.close()

if __name__ == "__main__":
    check_subs()
