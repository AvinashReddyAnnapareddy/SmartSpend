import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine
from database import Base, DATABASE_URL
from models import *  # This imports all models so Base.metadata.create_all works

# We first connect to the default 'postgres' database to create 'smartspend' if it doesn't exist
def create_database():
    try:
        # Connect to default database
        conn = psycopg2.connect(
            user="postgres",
            password="9492",
            host="localhost",
            port="5432",
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'smartspend'")
        exists = cur.fetchone()
        
        if not exists:
            cur.execute("CREATE DATABASE smartspend")
            print("Database 'smartspend' created successfully.")
        else:
            print("Database 'smartspend' already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error creating database: {e}")

def create_triggers_and_functions():
    engine = create_engine(DATABASE_URL)
    
    # 1. Create the tables
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    # 2. Add raw SQL for triggers and functions (Database Logic Role)
    print("Creating triggers and functions...")
    with engine.connect() as conn:
        # Function to check budget
        function_sql = """
        CREATE OR REPLACE FUNCTION check_budget_limit()
        RETURNS TRIGGER AS $$
        DECLARE
            v_monthly_limit FLOAT;
            v_total_spent FLOAT;
            v_current_month DATE;
        BEGIN
            -- Get the monthly budget limit for the category
            SELECT monthly_budget_limit INTO v_monthly_limit
            FROM categories
            WHERE id = NEW.category_id;
            
            -- If no limit is set, proceed normally
            IF v_monthly_limit IS NULL THEN
                RETURN NEW;
            END IF;
            
            -- Get the first day of the current month
            v_current_month := date_trunc('month', NEW.transaction_date)::DATE;
            
            -- Calculate total spent in this category for the current month
            SELECT COALESCE(SUM(amount), 0) INTO v_total_spent
            FROM transactions
            WHERE category_id = NEW.category_id
            AND date_trunc('month', transaction_date)::DATE = v_current_month;
            
            -- Include the new transaction amount
            v_total_spent := v_total_spent + NEW.amount;
            
            -- Check if limit is exceeded
            IF v_total_spent > v_monthly_limit THEN
                -- Insert an alert into budget_alerts table
                INSERT INTO budget_alerts (user_id, category_id, alert_message, alert_date)
                VALUES (
                    NEW.user_id, 
                    NEW.category_id, 
                    'Budget limit exceeded for category! Limit: ' || v_monthly_limit || ', Spent: ' || v_total_spent,
                    CURRENT_TIMESTAMP
                );
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
        
        # Trigger on transactions table
        trigger_sql = """
        DROP TRIGGER IF EXISTS trg_check_budget ON transactions;
        
        CREATE TRIGGER trg_check_budget
        AFTER INSERT OR UPDATE ON transactions
        FOR EACH ROW
        EXECUTE FUNCTION check_budget_limit();
        """
        
        # User health score update function (Gamification)
        health_score_function = """
        CREATE OR REPLACE FUNCTION update_health_score()
        RETURNS TRIGGER AS $$
        DECLARE
            v_type VARCHAR;
            v_current_score INTEGER;
        BEGIN
            -- Get the transaction type
            SELECT transaction_type INTO v_type
            FROM categories
            WHERE id = NEW.category_id;
            
            -- Get current health score
            SELECT health_score INTO v_current_score
            FROM users
            WHERE id = NEW.user_id;
            
            -- Adjust score
            IF v_type = 'INCOME' THEN
                v_current_score := v_current_score + 10;
            ELSIF v_type = 'EXPENSE' THEN
                v_current_score := v_current_score - 2;
            END IF;
            
            -- Cap score between 0 and 1000
            IF v_current_score > 1000 THEN
                v_current_score := 1000;
            ELSIF v_current_score < 0 THEN
                v_current_score := 0;
            END IF;
            
            -- Update user
            UPDATE users SET health_score = v_current_score WHERE id = NEW.user_id;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
        
        health_score_trigger = """
        DROP TRIGGER IF EXISTS trg_update_health ON transactions;
        
        CREATE TRIGGER trg_update_health
        AFTER INSERT ON transactions
        FOR EACH ROW
        EXECUTE FUNCTION update_health_score();
        """
        
        from sqlalchemy import text
        conn.execute(text(function_sql))
        conn.execute(text(trigger_sql))
        conn.execute(text(health_score_function))
        conn.execute(text(health_score_trigger))
        conn.commit()
        print("Triggers and functions created successfully.")

if __name__ == "__main__":
    create_database()
    create_triggers_and_functions()
