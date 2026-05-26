import sqlite3, json, os, sys

# Path to DB relative to this script: ../backend/mediscan.db
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'mediscan.db'))

print(f"DEBUG_DB_PATH:{db_path}")
if not os.path.exists(db_path):
    print(f"DB_NOT_FOUND:{db_path}")
    sys.exit(0)

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    # Row count
    try:
        cur.execute("SELECT COUNT(*) FROM diagnoses")
        cnt = cur.fetchone()[0]
    except Exception:
        cnt = 0
    print(f"COUNT:{cnt}")

    cur.execute("SELECT * FROM diagnoses ORDER BY created_at DESC LIMIT 50")
    rows = [dict(r) for r in cur.fetchall()]
    json_text = json.dumps(rows, indent=2, ensure_ascii=False)
    print(json_text)
    # Also write a UTF-8 encoded output file for reliable reading by tools
    out_path = os.path.join(os.path.dirname(__file__), 'query_db_output_utf8.json')
    try:
        with open(out_path, 'w', encoding='utf-8') as outf:
            outf.write(json_text)
    except Exception as e:
        print(f"ERROR_WRITING_OUTPUT:{e}")
except Exception as e:
    print(f"ERROR:{e}")
finally:
    try:
        conn.close()
    except Exception:
        pass
