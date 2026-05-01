from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from jose import JWTError, jwt
import models, schemas, crud
from database import engine, get_db
import easyocr
from PIL import Image
import io
import numpy as np

# Initialize the EasyOCR reader once so it doesn't reload on every request
# This might download models on the very first run
reader = easyocr.Reader(['en'])

# Secret key for JWT
SECRET_KEY = "your-secret-key-replace-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

app = FastAPI(title="SmartSpend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not crud.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me/", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.put("/users/me/", response_model=schemas.UserResponse)
async def update_user_me(user_update: schemas.UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.update_user(db=db, user_id=current_user.id, user_update=user_update)

# --- Categories ---
@app.post("/categories/", response_model=schemas.CategoryResponse)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_category(db=db, category=category, user_id=current_user.id)

@app.get("/categories/", response_model=List[schemas.CategoryResponse])
def read_categories(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_categories(db, user_id=current_user.id)

# --- Budgets ---
@app.post("/budgets/", response_model=schemas.BudgetResponse)
def create_budget(budget: schemas.BudgetCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not budget.category_ids:
        raise HTTPException(status_code=400, detail="At least one category is required")
    try:
        return crud.create_budget(db=db, budget=budget, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/budgets/", response_model=List[schemas.BudgetResponse])
def read_budgets(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_budgets(db, user_id=current_user.id)


@app.put("/budgets/{budget_id}", response_model=schemas.BudgetResponse)
def update_budget(budget_id: int, budget_update: schemas.BudgetUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        updated = crud.update_budget(db=db, budget_id=budget_id, budget_update=budget_update, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not updated:
        raise HTTPException(status_code=404, detail="Budget not found")
    return updated

@app.delete("/budgets/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_budget(db=db, budget_id=budget_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Budget not found")
    return None

# --- Transactions ---
@app.post("/transactions/", response_model=schemas.TransactionResponse)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_transaction(db=db, transaction=transaction, user_id=current_user.id)

@app.get("/transactions/", response_model=List[schemas.TransactionResponse])
def read_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_transactions(db, user_id=current_user.id, skip=skip, limit=limit)

@app.put("/transactions/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(transaction_id: int, transaction_update: schemas.TransactionUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    updated = crud.update_transaction(db=db, transaction_id=transaction_id, transaction_update=transaction_update, user_id=current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return updated

@app.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_transaction(db=db, transaction_id=transaction_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return None

# --- Analytics ---
@app.get("/analytics/spending-by-category")
def get_spending_by_category(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_spending_by_category(db, user_id=current_user.id)

@app.get("/analytics/monthly-overview")
def get_monthly_overview(year: int = datetime.now().year, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_monthly_overview(db, user_id=current_user.id, year=year)

@app.get("/alerts/", response_model=List[schemas.BudgetAlertResponse])
def get_alerts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_budget_alerts(db, user_id=current_user.id)

# --- OCR Receipt Scanner ---
@app.post("/scan-receipt/")
async def scan_receipt(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert PIL image to numpy array for easyocr
        img_np = np.array(image)
        
        # Extract text using easyocr
        result = reader.readtext(img_np, detail=0)
        text = "\n".join(result)
        
        # Improved parsing logic
        import re
        
        # Helper to extract amount
        def extract_amount(text):
            # Remove commas to handle numbers like 1,234.56
            clean_text = text.replace(',', '')
            
            # List of keywords and their regex patterns
            keywords = [
                r'Total', r'Grand\s*Total', r'Net\s*Amount', r'Amount\s*Payable', 
                r'Total\s*Due', r'Amount', r'Total\s*Rs', r'Total\s*₹', r'Net\s*Payable',
                r'Balance\s*Due', r'Total\s*Amt'
            ]
            
            found_amounts = []
            for kw in keywords:
                # Match keyword followed by optional symbols and then the number
                pattern = rf'{kw}[:\s]*[₹$Rs.]*\s*([\d\.]+)'
                matches = re.findall(pattern, clean_text, re.IGNORECASE)
                for m in matches:
                    try:
                        found_amounts.append(float(m))
                    except ValueError:
                        continue
            
            if found_amounts:
                # Usually the largest "total" mentioned is the final one
                return max(found_amounts)
            
            # Fallback: Find all numbers that look like prices (x.xx) and pick the largest one
            all_prices = re.findall(r'[\d]+\.[\d]{2}', clean_text)
            if not all_prices:
                all_prices = re.findall(r'[\d]+\.[\d]+', clean_text)
            
            if all_prices:
                floats = []
                for p in all_prices:
                    try:
                        val = float(p)
                        # Filter out things that are likely years or long ID numbers
                        if 0.01 <= val < 1000000:
                            floats.append(val)
                    except ValueError:
                        continue
                if floats:
                    return max(floats)
            return 0.0

        amount = extract_amount(text)
        
        return {"extracted_text": text, "suggested_amount": amount}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Groups ---
@app.post("/groups/", response_model=schemas.GroupResponse)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_group(db=db, group=group, user_id=current_user.id)

@app.post("/groups/join", response_model=schemas.GroupResponse)
def join_group(invite_code: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = crud.join_group(db=db, invite_code=invite_code, user_id=current_user.id)
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code or group not found")
    return group

@app.get("/groups/", response_model=List[schemas.GroupResponse])
def get_user_groups(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_user_groups(db=db, user_id=current_user.id)

@app.get("/groups/{group_id}", response_model=schemas.GroupResponse)
def get_group(group_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = crud.get_group(db=db, group_id=group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    # Basic check if user is in group
    is_member = any(m.user_id == current_user.id for m in group.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    return group

@app.post("/groups/{group_id}/expenses", response_model=schemas.GroupExpenseResponse)
def create_group_expense(group_id: int, expense: schemas.GroupExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if member
    group = crud.get_group(db=db, group_id=group_id)
    if not group or not any(m.user_id == current_user.id for m in group.members):
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    return crud.create_group_expense(db=db, expense=expense, group_id=group_id, user_id=current_user.id)

@app.get("/groups/{group_id}/expenses", response_model=List[schemas.GroupExpenseResponse])
def get_group_expenses(group_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if member
    group = crud.get_group(db=db, group_id=group_id)
    if not group or not any(m.user_id == current_user.id for m in group.members):
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    return crud.get_group_expenses(db=db, group_id=group_id)

@app.get("/groups/{group_id}/balances", response_model=List[schemas.GroupBalance])
def get_group_balances(group_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if member
    group = crud.get_group(db=db, group_id=group_id)
    if not group or not any(m.user_id == current_user.id for m in group.members):
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    return crud.get_group_balances(db=db, group_id=group_id)

# --- Subscriptions ---
@app.post("/subscriptions/", response_model=schemas.SubscriptionResponse)
def create_subscription(subscription: schemas.SubscriptionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_subscription(db=db, subscription=subscription, user_id=current_user.id)

@app.get("/subscriptions/", response_model=List[schemas.SubscriptionResponse])
def get_subscriptions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_subscriptions(db=db, user_id=current_user.id)

@app.delete("/subscriptions/{sub_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(sub_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_subscription(db=db, sub_id=sub_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return None

@app.post("/subscriptions/{sub_id}/pay", response_model=schemas.SubscriptionResponse)
def pay_subscription(sub_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sub = crud.update_subscription_next_billing(db=db, sub_id=sub_id, user_id=current_user.id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub

