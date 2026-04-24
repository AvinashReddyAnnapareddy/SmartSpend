# SmartSpend - Finance Tracker and Analyser

SmartSpend is a full-stack Finance Tracker and Analyser built with React, FastAPI, and PostgreSQL. It helps users log daily transactions, categorize spending, set budget limits, and gain visual insights into their financial health.

## Team Roles & Implementation Details

1. **Database Architect (Victor)**: Designed the schema for `Users`, `Categories`, `CategorizationRules`, `Transactions`, `BudgetAlerts`, and `Subscriptions`, ensuring normalization and referential integrity using SQLAlchemy models (`backend/models.py`).
2. **Database Logic (Gireesh)**: Implemented complex PostgreSQL logic directly in the database (`backend/init_db.py`). 
   - Wrote a trigger and function `check_budget_limit()` that automatically creates a warning in `BudgetAlerts` if a user's transaction exceeds their monthly category limit.
   - Wrote a gamification trigger `update_health_score()` that updates a user's "Health Score" dynamically upon new transactions.
3. **Data Analyst (Nayan)**: Authored complex aggregation queries in `backend/crud.py` (e.g., `get_monthly_overview`, `get_spending_by_category`) to transform raw data into report-ready JSON objects for Recharts. Also simulated rule-based tagging via backend API.
4. **Backend (Surya)**: Built the FastAPI endpoints (`backend/main.py`) connecting the Postgres DB to the React frontend. Implemented secure JWT user authentication, dependency injection for database sessions, and the OCR Receipt Scanner using `pytesseract`.
5. **Frontend (Avinash)**: Developed the responsive, premium UI using React, TailwindCSS, and Recharts. Integrated Axios to communicate with the FastAPI backend, removing legacy hardcoded mocks and third-party Google auth, ensuring a cohesive application flow.

## Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **PostgreSQL**: Must be running on port `5432` with user `postgres` and password `9492`.
- **Tesseract-OCR (Windows)**: Required for the Smart Receipt Scanner feature. Download and install it from [UB-Mannheim](https://github.com/UB-Mannheim/tesseract/wiki). Ensure it is added to your system PATH.

## Setup Instructions

### 1. Database Setup

Before running the backend, create the database:
1. Open `psql` or pgAdmin.
2. Log in with `postgres` and password `9492`.
3. Create the database: `CREATE DATABASE smartspend;`

Alternatively, you can run the backend initialization script which attempts to create the DB and adds triggers/functions:
```bash
cd backend
pip install -r requirements.txt
python init_db.py
```

### 2. Running the Backend

```bash
cd backend
uvicorn main:app --reload
```
The FastAPI backend will start on `http://localhost:8000`. You can view the interactive API documentation at `http://localhost:8000/docs`.

### 3. Running the Frontend

```bash
cd frontend
npm install
npm run dev
```
The React frontend will start on `http://localhost:3000` (or `5173` depending on Vite settings). 

### First Run Notes
- Open the frontend. You will be greeted by the Login page.
- Because there is no registration UI right now, you must create a user manually.
- Use the FastAPI Swagger UI at `http://localhost:8000/docs` to POST to `/users/` and create your first user.
- Then, log in via the React frontend using the credentials you just created.

## Features Implemented
- **Transaction Management**: Full CRUD operations on backend, visual listing on frontend.
- **Categorization & Budgeting**: Database triggers ensure budgets are tracked dynamically.
- **Analytics Dashboard**: React-based charts fueled by raw SQL aggregations.
- **Smart Receipt Scanner**: Python-powered OCR endpoint capable of parsing uploaded receipt images for total amounts.
- **Financial Health Score**: Gamified scoring managed securely within PostgreSQL triggers.
