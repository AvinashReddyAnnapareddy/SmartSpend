import sqlite3
import os

db_path = os.path.join('backend', 'sql_app.db')
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, user_id, name, amount, is_active FROM subscriptions")
        rows = cursor.fetchall()
        print("ID | UserID | Name | Amount | Active")
        print("-" * 40)
        for row in rows:
            print(f"{row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
