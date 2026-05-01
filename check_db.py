import sqlite3
import os

db_path = 'backend/database.db'
print(f"Checking database at: {os.path.abspath(db_path)}")
print(f"File exists: {os.path.exists(db_path)}")
if os.path.exists(db_path):
    print(f"File size: {os.path.getsize(db_path)} bytes")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print(f"Tables: {tables}")

for table in tables:
    t_name = table[0]
    cursor.execute(f"PRAGMA table_info({t_name});")
    print(f"Columns in {t_name}: {cursor.fetchall()}")

conn.close()
