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
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI(title="SmartSpend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev, restrict in prod
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

# --- Transactions ---
@app.post("/transactions/", response_model=schemas.TransactionResponse)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_transaction(db=db, transaction=transaction, user_id=current_user.id)

@app.get("/transactions/", response_model=List[schemas.TransactionResponse])
def read_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_transactions(db, user_id=current_user.id, skip=skip, limit=limit)

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
