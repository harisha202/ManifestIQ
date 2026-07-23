from sqlalchemy import text
from app.db.session import engine

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE query_logs ADD COLUMN response_time_ms INTEGER DEFAULT 1200;"))
        conn.commit()
        print("Successfully added column.")
    except Exception as e:
        print(f"Error (maybe column exists?): {e}")
