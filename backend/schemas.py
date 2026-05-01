from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import List, Optional
from models import TransactionType

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    health_score: int

    class Config:
        from_attributes = True

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str
    transaction_type: TransactionType
    monthly_budget_limit: Optional[float] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- Budget Schemas ---
class BudgetBase(BaseModel):
    name: str
    amount: float


class BudgetCreate(BudgetBase):
    category_ids: List[int]


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    category_ids: Optional[List[int]] = None


class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    created_at: datetime
    categories: List[CategoryResponse]

    class Config:
        from_attributes = True

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    category_id: int
    amount: float
    transaction_date: date
    description: Optional[str] = None
    currency: Optional[str] = "INR"

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    category: CategoryResponse

    class Config:
        from_attributes = True

# --- Budget Alert Schemas ---
class BudgetAlertResponse(BaseModel):
    id: int
    user_id: int
    category_id: int
    alert_message: str
    alert_date: datetime

    class Config:
        from_attributes = True

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
