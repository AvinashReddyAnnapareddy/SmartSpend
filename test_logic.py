from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from backend.models import Subscription, User
from backend.database import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def simulate_pay():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        
        print(f"Before: {sub.name} - Date: {sub.next_billing_date}")
        
        # Manually call crud function
        from backend.crud import update_subscription_next_billing
        updated_sub = update_subscription_next_billing(db, sub.id, user.id)
        
        print(f"After : {updated_sub.name} - Date: {updated_sub.next_billing_date}")
    finally:
        db.close()

if __name__ == "__main__":
    simulate_pay()
