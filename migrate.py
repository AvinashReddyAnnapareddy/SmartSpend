import sqlite3

def migrate():
    conn = sqlite3.connect('backend/database.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN full_name TEXT")
        print("Added full_name column")
    except sqlite3.OperationalError:
        print("full_name column already exists")
        
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN phone_number TEXT")
        print("Added phone_number column")
    except sqlite3.OperationalError:
        print("phone_number column already exists")
        
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")
        print("Added avatar_url column")
    except sqlite3.OperationalError:
        print("avatar_url column already exists")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
