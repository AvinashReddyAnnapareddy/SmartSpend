from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import List, Optional
from models import TransactionType

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None

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

class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = None
    transaction_date: Optional[date] = None
    description: Optional[str] = None
    currency: Optional[str] = None

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

# --- Group Schemas ---
class GroupMemberResponse(BaseModel):
    id: int
    user_id: int
    joined_at: datetime
    user: Optional[UserBase] = None

    class Config:
        from_attributes = True

class GroupBase(BaseModel):
    name: str

class GroupCreate(GroupBase):
    pass

class GroupResponse(GroupBase):
    id: int
    invite_code: str
    created_by: int
    created_at: datetime
    members: List[GroupMemberResponse] = []

    class Config:
        from_attributes = True

class GroupExpenseBase(BaseModel):
    amount: float
    description: str
    is_settlement: bool = False

class GroupExpenseCreate(GroupExpenseBase):
    pass

class GroupExpenseResponse(GroupExpenseBase):
    id: int
    group_id: int
    paid_by: int
    date: datetime
    payer: Optional[UserBase] = None

    class Config:
        from_attributes = True

class GroupBalance(BaseModel):
    user_id: int
    username: str
    balance: float

# --- Subscription Schemas ---
class SubscriptionBase(BaseModel):
    name: str
    amount: float
    billing_cycle: str = "MONTHLY"
    next_billing_date: date

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionResponse(SubscriptionBase):
    id: int
    user_id: int
    is_active: bool

    class Config:
        from_attributes = True
