from database import SessionLocal
import models

db = SessionLocal()
try:
    categories = db.query(models.Category).all()
    print(f"Found {len(categories)} categories")
    for cat in categories:
        print(f" - {cat.id}: {cat.name} ({cat.transaction_type}) [User: {cat.user_id}]")
    
    users = db.query(models.User).all()
    print(f"Found {len(users)} users")
    for user in users:
        print(f" - {user.id}: {user.username}")
finally:
    db.close()
