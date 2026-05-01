import random
from datetime import date, timedelta
from database import SessionLocal, engine
from models import User, Category, Transaction, TransactionType, Base
import crud
from schemas import UserCreate, CategoryCreate, TransactionCreate

def seed_database():
    print("Seeding database...")
    db = SessionLocal()

    # Create 3 users
    users_data = [
        {"username": "alice", "email": "alice@example.com", "password": "password123"},
        {"username": "bob", "email": "bob@example.com", "password": "password123"},
        {"username": "charlie", "email": "charlie@example.com", "password": "password123"}
    ]

    users = []
    for u_data in users_data:
        existing = crud.get_user_by_username(db, username=u_data["username"])
        if not existing:
            user = crud.create_user(db, UserCreate(**u_data))
            users.append(user)
        else:
            users.append(existing)

    categories_template = [
        {"name": "Salary", "type": TransactionType.INCOME, "limit": None},
        {"name": "Groceries", "type": TransactionType.EXPENSE, "limit": 5000},
        {"name": "Rent", "type": TransactionType.EXPENSE, "limit": 15000},
        {"name": "Entertainment", "type": TransactionType.EXPENSE, "limit": 3000},
        {"name": "Transport", "type": TransactionType.EXPENSE, "limit": 2000},
    ]

    for user in users:
        # Check if user has categories
        existing_cats = crud.get_categories(db, user.id)
        if not existing_cats:
            user_categories = []
            for c in categories_template:
                cat = crud.create_category(db, CategoryCreate(
                    name=c["name"],
                    transaction_type=c["type"],
                    monthly_budget_limit=c["limit"]
                ), user.id)
                user_categories.append(cat)
                
                if c["limit"] is not None:
                    from schemas import BudgetCreate
                    try:
                        crud.create_budget(db, BudgetCreate(
                            name=c["name"],
                            amount=c["limit"],
                            category_ids=[cat.id]
                        ), user.id)
                    except ValueError:
                        pass
            
            # Create some transactions
            print(f"Creating transactions for {user.username}...")
            today = date.today()
            for i in range(30):
                # Random date within last 60 days
                tx_date = today - timedelta(days=random.randint(0, 60))
                cat = random.choice(user_categories)
                
                amount = random.uniform(100, 2000)
                if cat.name == "Rent":
                    amount = 15000
                elif cat.name == "Salary":
                    amount = random.uniform(40000, 60000)
                
                crud.create_transaction(db, TransactionCreate(
                    category_id=cat.id,
                    amount=round(amount, 2),
                    transaction_date=tx_date,
                    description=f"Sample {cat.name} transaction",
                    currency="INR"
                ), user.id)

    db.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_database()
