import psycopg2
import sys

DB_HOST = "172.26.6.52"
DB_PORT = "5432"
DB_NAME = "postgres"

def test_connection(user, password, label):
    print(f"\n--- Testing {label} ({user}) ---")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=user,
            password=password
        )
        print("Connection: Success")
        
        cur = conn.cursor()
        
        # 1. Check Animation Table Count
        try:
            cur.execute("SELECT COUNT(*) FROM public.Animation")
            count = cur.fetchone()[0]
            print(f"Animation Count: {count}")
            
            if count > 0:
                cur.execute("SELECT aid, name FROM public.Animation LIMIT 3")
                rows = cur.fetchall()
                print("First 3 Animations:")
                for r in rows:
                    print(f"  - {r}")
        except Exception as e:
            print(f"Read Animation Error: {e}")

        # 2. Check Covers Table Permission
        try:
            cur.execute("SELECT COUNT(*) FROM public.covers")
            print(f"Covers Count: {cur.fetchone()[0]}")
        except Exception as e:
            print(f"Read Covers Error: {e}")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    # Test Remote App User (Reader) - Explicitly testing the user you confirmed
    test_connection("remote_app_user", "User@123", "Remote App User (Reader)")
