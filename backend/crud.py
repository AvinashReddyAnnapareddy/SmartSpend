from sqlalchemy.orm import Session
import models, schemas
from passlib.context import CryptContext
from sqlalchemy import func
from datetime import date

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(username=user.username, email=user.email, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Add default categories
    default_categories = [
        ("Salary", models.TransactionType.INCOME, None),
        ("Groceries", models.TransactionType.EXPENSE, 5000.0),
        ("Rent", models.TransactionType.EXPENSE, 15000.0),
        ("Entertainment", models.TransactionType.EXPENSE, 2000.0),
        ("Transport", models.TransactionType.EXPENSE, 3000.0),
        ("Shopping", models.TransactionType.EXPENSE, 5000.0),
    ]
    for name, t_type, limit in default_categories:
        db_cat = models.Category(name=name, transaction_type=t_type, monthly_budget_limit=limit, user_id=db_user.id)
        db.add(db_cat)
    db.commit()
    
    return db_user

def create_category(db: Session, category: schemas.CategoryCreate, user_id: int):
    db_category = models.Category(**category.dict(), user_id=user_id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_categories(db: Session, user_id: int):
    return db.query(models.Category).filter(models.Category.user_id == user_id).all()

def create_transaction(db: Session, transaction: schemas.TransactionCreate, user_id: int):
    db_transaction = models.Transaction(**transaction.dict(), user_id=user_id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_transactions(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Transaction).filter(models.Transaction.user_id == user_id).order_by(models.Transaction.transaction_date.desc()).offset(skip).limit(limit).all()

def get_budget_alerts(db: Session, user_id: int):
    return db.query(models.BudgetAlert).filter(models.BudgetAlert.user_id == user_id).order_by(models.BudgetAlert.alert_date.desc()).all()

# Analytics Queries
def get_monthly_overview(db: Session, user_id: int, year: int):
    # Returns monthly spending
    result = db.query(
        func.to_char(models.Transaction.transaction_date, 'Mon').label('month'),
        func.sum(models.Transaction.amount).label('total')
    ).join(models.Category).filter(
        models.Transaction.user_id == user_id,
        models.Category.transaction_type == models.TransactionType.EXPENSE,
        func.extract('year', models.Transaction.transaction_date) == year
    ).group_by(
        func.to_char(models.Transaction.transaction_date, 'Mon'),
        func.extract('month', models.Transaction.transaction_date)
    ).order_by(
        func.extract('month', models.Transaction.transaction_date)
    ).all()
    
    return [{"name": r.month, "amount": r.total} for r in result]

def get_spending_by_category(db: Session, user_id: int):
    result = db.query(
        models.Category.name,
        func.sum(models.Transaction.amount).label('total')
    ).join(models.Transaction).filter(
        models.Transaction.user_id == user_id,
        models.Category.transaction_type == models.TransactionType.EXPENSE
    ).group_by(models.Category.name).all()
    
    total_spent = sum(r.total for r in result) if result else 0
    if total_spent == 0:
        return []
        
    colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1']
    return [
        {
            "name": r.name,
            "value": round((r.total / total_spent) * 100, 1),
            "amount": r.total,
            "color": colors[i % len(colors)]
        }
        for i, r in enumerate(result)
    ]
