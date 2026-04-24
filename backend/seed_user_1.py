from database import SessionLocal
import models

db = SessionLocal()
try:
    user_id = 1
    # Check if user 1 already has categories
    existing = db.query(models.Category).filter(models.Category.user_id == user_id).all()
    if not existing:
        default_categories = [
            ("Salary", models.TransactionType.INCOME, None),
            ("Groceries", models.TransactionType.EXPENSE, 5000.0),
            ("Rent", models.TransactionType.EXPENSE, 15000.0),
            ("Entertainment", models.TransactionType.EXPENSE, 2000.0),
            ("Transport", models.TransactionType.EXPENSE, 3000.0),
            ("Shopping", models.TransactionType.EXPENSE, 5000.0),
        ]
        for name, t_type, limit in default_categories:
            db_cat = models.Category(name=name, transaction_type=t_type, monthly_budget_limit=limit, user_id=user_id)
            db.add(db_cat)
        db.commit()
        print("Added default categories for user 1")
    else:
        print("User 1 already has categories")
finally:
    db.close()
