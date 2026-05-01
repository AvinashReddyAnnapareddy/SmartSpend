import os
from sqlalchemy import create_engine, text

# Get DATABASE_URL from the same place database.py does
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:9492@localhost:5432/smartspend")

print(f"Connecting to: {DATABASE_URL}")
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        # Check if columns exist
        print("Checking users table...")
        
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR"))
            print("Added full_name column")
        except Exception as e:
            print(f"Note: {e}")
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR"))
            print("Added phone_number column")
        except Exception as e:
            print(f"Note: {e}")
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR"))
            print("Added avatar_url column")
        except Exception as e:
            print(f"Note: {e}")
            
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
