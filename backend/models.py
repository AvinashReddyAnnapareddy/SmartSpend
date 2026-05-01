from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Enum as SQLEnum, Boolean, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

budget_categories = Table(
    "budget_categories",
    Base.metadata,
    Column("budget_id", Integer, ForeignKey("budgets.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
)

class TransactionType(str, enum.Enum):
    INCOME = 'INCOME'
    EXPENSE = 'EXPENSE'

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Financial health score (gamification)
    health_score = Column(Integer, default=500)
    
    categories = relationship("Category", back_populates="owner")
    transactions = relationship("Transaction", back_populates="owner")
    budget_alerts = relationship("BudgetAlert", back_populates="owner")
    budgets = relationship("Budget", back_populates="owner")
    rules = relationship("CategorizationRule", back_populates="owner")
    subscriptions = relationship("Subscription", back_populates="owner")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    monthly_budget_limit = Column(Float, nullable=True)

    owner = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    rules = relationship("CategorizationRule", back_populates="category")
    budget_alerts = relationship("BudgetAlert", back_populates="category")
    budgets = relationship("Budget", secondary=budget_categories, back_populates="categories")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="budgets")
    categories = relationship("Category", secondary=budget_categories, back_populates="budgets")

class CategorizationRule(Base):
    __tablename__ = "categorization_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    keyword = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))

    owner = relationship("User", back_populates="rules")
    category = relationship("Category", back_populates="rules")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    amount = Column(Float, nullable=False)
    transaction_date = Column(Date, nullable=False)
    description = Column(String, nullable=True)
    currency = Column(String, default="INR") # Multi-currency support

    owner = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")

class BudgetAlert(Base):
    __tablename__ = "budget_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    alert_message = Column(String, nullable=False)
    alert_date = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="budget_alerts")
    category = relationship("Category", back_populates="budget_alerts")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    billing_cycle = Column(String, default="MONTHLY")
    next_billing_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)

    owner = relationship("User", back_populates="subscriptions")
