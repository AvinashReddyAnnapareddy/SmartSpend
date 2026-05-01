from database import SessionLocal
from models import Category, Budget

def fix_missing_budgets():
    db = SessionLocal()
    categories = db.query(Category).filter(Category.monthly_budget_limit.isnot(None)).all()
    count = 0
    
    for cat in categories:
        existing_budget = db.query(Budget).filter(Budget.user_id == cat.user_id, Budget.name == cat.name).first()
        if not existing_budget:
            new_budget = Budget(user_id=cat.user_id, name=cat.name, amount=cat.monthly_budget_limit)
            new_budget.categories.append(cat)
            db.add(new_budget)
            count += 1
            
    db.commit()
    db.close()
    print(f"Fixed {count} missing budgets.")

if __name__ == '__main__':
    fix_missing_budgets()
