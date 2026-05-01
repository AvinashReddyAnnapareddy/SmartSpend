from sqlalchemy.orm import Session, selectinload
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
        db.flush() # flush to get db_cat.id
        if limit is not None:
            db_budget = models.Budget(user_id=db_user.id, name=name, amount=limit)
            db_budget.categories.append(db_cat)
            db.add(db_budget)
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


def create_budget(db: Session, budget: schemas.BudgetCreate, user_id: int):
    category_ids = list(dict.fromkeys(budget.category_ids))
    categories = (
        db.query(models.Category)
        .filter(models.Category.user_id == user_id, models.Category.id.in_(category_ids))
        .all()
    )
    if len(categories) != len(category_ids):
        raise ValueError("One or more categories are invalid")

    db_budget = models.Budget(user_id=user_id, name=budget.name, amount=budget.amount)
    db_budget.categories = categories
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    # Force load the categories relationship
    db.refresh(db_budget, ['categories'])
    return db_budget


def get_budgets(db: Session, user_id: int):
    return (
        db.query(models.Budget)
        .options(selectinload(models.Budget.categories))
        .filter(models.Budget.user_id == user_id)
        .order_by(models.Budget.created_at.desc())
        .all()
    )


def get_budget(db: Session, budget_id: int, user_id: int):
    return (
        db.query(models.Budget)
        .options(selectinload(models.Budget.categories))
        .filter(models.Budget.id == budget_id, models.Budget.user_id == user_id)
        .first()
    )


def update_budget(db: Session, budget_id: int, budget_update: schemas.BudgetUpdate, user_id: int):
    db_budget = db.query(models.Budget).filter(models.Budget.id == budget_id, models.Budget.user_id == user_id).first()
    if not db_budget:
        return None

    if budget_update.name is not None:
        db_budget.name = budget_update.name
    if budget_update.amount is not None:
        db_budget.amount = budget_update.amount
    if budget_update.category_ids is not None:
        category_ids = list(dict.fromkeys(budget_update.category_ids))
        categories = (
            db.query(models.Category)
            .filter(models.Category.user_id == user_id, models.Category.id.in_(category_ids))
            .all()
        )
        if len(categories) != len(category_ids):
            raise ValueError("One or more categories are invalid")
        db_budget.categories = categories

    db.commit()
    db.refresh(db_budget)
    return db_budget


def delete_budget(db: Session, budget_id: int, user_id: int):
    db_budget = db.query(models.Budget).filter(models.Budget.id == budget_id, models.Budget.user_id == user_id).first()
    if not db_budget:
        return False
    db.delete(db_budget)
    db.commit()
    return True

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

import random
import string

def generate_invite_code(length=8):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def create_group(db: Session, group: schemas.GroupCreate, user_id: int):
    # Generate unique invite code
    while True:
        code = generate_invite_code()
        if not db.query(models.Group).filter(models.Group.invite_code == code).first():
            break
            
    db_group = models.Group(name=group.name, invite_code=code, created_by=user_id)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Add creator as a member
    db_member = models.GroupMember(group_id=db_group.id, user_id=user_id)
    db.add(db_member)
    db.commit()
    
    return db_group

def join_group(db: Session, invite_code: str, user_id: int):
    group = db.query(models.Group).filter(models.Group.invite_code == invite_code).first()
    if not group:
        return None
        
    # Check if already a member
    existing_member = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group.id,
        models.GroupMember.user_id == user_id
    ).first()
    
    if not existing_member:
        db_member = models.GroupMember(group_id=group.id, user_id=user_id)
        db.add(db_member)
        db.commit()
        
    return group

def get_user_groups(db: Session, user_id: int):
    # Get all groups where the user is a member
    member_groups = db.query(models.Group).join(models.GroupMember).filter(models.GroupMember.user_id == user_id).all()
    return member_groups

def get_group(db: Session, group_id: int):
    return db.query(models.Group).options(
        selectinload(models.Group.members).selectinload(models.GroupMember.user)
    ).filter(models.Group.id == group_id).first()

def create_group_expense(db: Session, expense: schemas.GroupExpenseCreate, group_id: int, user_id: int):
    db_expense = models.GroupExpense(
        group_id=group_id,
        paid_by=user_id,
        amount=expense.amount,
        description=expense.description,
        is_settlement=expense.is_settlement
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    # Force load payer
    db.refresh(db_expense, ['payer'])
    return db_expense

def get_group_expenses(db: Session, group_id: int):
    return db.query(models.GroupExpense).options(
        selectinload(models.GroupExpense.payer)
    ).filter(models.GroupExpense.group_id == group_id).order_by(models.GroupExpense.date.desc()).all()

def get_group_balances(db: Session, group_id: int):
    group = get_group(db, group_id)
    if not group:
        return []
        
    members = group.members
    num_members = len(members)
    if num_members == 0:
        return []
        
    expenses = get_group_expenses(db, group_id)
    
    balances = {m.user_id: 0.0 for m in members}
    
    for exp in expenses:
        if exp.is_settlement:
            continue
            
        if exp.paid_by in balances:
            balances[exp.paid_by] += exp.amount
            
        split_amount = exp.amount / num_members
        for m in members:
            if m.user_id in balances:
                balances[m.user_id] -= split_amount
                
    result = []
    for m in members:
        result.append(schemas.GroupBalance(
            user_id=m.user_id,
            username=m.user.username,
            balance=round(balances[m.user_id], 2)
        ))
        
    return result

def create_subscription(db: Session, subscription: schemas.SubscriptionCreate, user_id: int):
    db_sub = models.Subscription(**subscription.dict(), user_id=user_id)
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

def get_subscriptions(db: Session, user_id: int):
    return db.query(models.Subscription).filter(models.Subscription.user_id == user_id).order_by(models.Subscription.next_billing_date.asc()).all()

def delete_subscription(db: Session, sub_id: int, user_id: int):
    db_sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id, models.Subscription.user_id == user_id).first()
    if not db_sub:
        return False
    db_sub.is_active = False
    db.commit()
    return True

def update_subscription_next_billing(db: Session, sub_id: int, user_id: int):
    import datetime
    import calendar
    
    db_sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id, models.Subscription.user_id == user_id).first()
    if not db_sub:
        return None
    
    current_date = db_sub.next_billing_date
    if db_sub.billing_cycle == "MONTHLY":
        # Calculate next month
        month = current_date.month
        year = current_date.year
        if month == 12:
            month = 1
            year += 1
        else:
            month += 1
        
        # Handle end of month (e.g. Jan 31 -> Feb 28)
        last_day_of_month = calendar.monthrange(year, month)[1]
        day = min(current_date.day, last_day_of_month)
        
        db_sub.next_billing_date = datetime.date(year, month, day)
        
    elif db_sub.billing_cycle == "YEARLY":
        # Calculate next year
        year = current_date.year + 1
        month = current_date.month
        day = current_date.day
        
        # Handle leap year (Feb 29 -> Feb 28)
        if month == 2 and day == 29 and not calendar.isleap(year):
            day = 28
            
        db_sub.next_billing_date = datetime.date(year, month, day)
    
    db.commit()
    db.refresh(db_sub)
    return db_sub
