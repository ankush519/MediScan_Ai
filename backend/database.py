import os
import sqlite3
import datetime
import uuid
from typing import Dict, List, Any, Optional
from backend.config import settings

# Database connection status
is_mongodb = False
mongo_client = None
db = None

# Local SQLite connection helper
SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mediscan.db")

def init_sqlite_db():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    
    # Create Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'doctor',
        created_at TEXT NOT NULL
    )
    """)
    
    # Create Diagnoses Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS diagnoses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        symptoms TEXT,
        prediction TEXT NOT NULL,
        confidence REAL NOT NULL,
        risk_level TEXT NOT NULL,
        recommendations TEXT NOT NULL, -- JSON string or comma-separated
        original_image TEXT NOT NULL,   -- Base64 or local filename
        heatmap_image TEXT NOT NULL,    -- Base64 or local filename
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)
    
    # Create Chats Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)
    conn.commit()
    conn.close()

# Try initializing MongoDB if URI is provided
if settings.MONGODB_URL:
    try:
        from pymongo import MongoClient
        mongo_client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
        # Verify connection
        mongo_client.server_info()
        db = mongo_client[settings.DATABASE_NAME]
        is_mongodb = True
        print("Connected successfully to MongoDB Atlas.")
    except Exception as e:
        print(f"MongoDB connection failed: {e}. Falling back to local SQLite.")
        init_sqlite_db()
else:
    print("No MongoDB URL provided. Using local SQLite database.")
    init_sqlite_db()

# DB CRUD Operations Wrapper

def get_db_connection():
    if not is_mongodb:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    return None

# User Operations
def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    if is_mongodb:
        user = db.users.find_one({"email": email})
        if user:
            user["id"] = str(user.get("_id", user.get("id")))
            return user
        return None
    else:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    if is_mongodb:
        # Check standard id
        user = db.users.find_one({"id": user_id})
        if user:
            user["id"] = str(user.get("id"))
            return user
        return None
    else:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

def create_user(email: str, hashed_password: str, full_name: str, role: str = "doctor") -> Dict[str, Any]:
    user_id = str(uuid.uuid4())
    created_at = datetime.datetime.now().isoformat()
    
    user_data = {
        "id": user_id,
        "email": email,
        "hashed_password": hashed_password,
        "full_name": full_name,
        "role": role,
        "created_at": created_at
    }
    
    if is_mongodb:
        db.users.insert_one(user_data.copy())
    else:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (id, email, hashed_password, full_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, email, hashed_password, full_name, role, created_at)
        )
        conn.commit()
        conn.close()
        
    return user_data

# Diagnosis Operations
def save_diagnosis(
    user_id: str,
    patient_name: str,
    symptoms: str,
    prediction: str,
    confidence: float,
    risk_level: str,
    recommendations: List[str],
    original_image: str,
    heatmap_image: str
) -> Dict[str, Any]:
    diag_id = str(uuid.uuid4())
    created_at = datetime.datetime.now().isoformat()
    
    import json
    recommendations_str = json.dumps(recommendations)
    
    diag_data = {
        "id": diag_id,
        "user_id": user_id,
        "patient_name": patient_name,
        "symptoms": symptoms,
        "prediction": prediction,
        "confidence": confidence,
        "risk_level": risk_level,
        "recommendations": recommendations,
        "original_image": original_image, # Store image (either path or Base64 data)
        "heatmap_image": heatmap_image,   # Store image heatmap
        "created_at": created_at
    }
    
    if is_mongodb:
        db.diagnoses.insert_one(diag_data.copy())
    else:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO diagnoses (id, user_id, patient_name, symptoms, prediction, confidence, risk_level, recommendations, original_image, heatmap_image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (diag_id, user_id, patient_name, symptoms, prediction, confidence, risk_level, recommendations_str, original_image, heatmap_image, created_at)
        )
        conn.commit()
        conn.close()
        
    return diag_data

def get_diagnoses_by_user(user_id: str) -> List[Dict[str, Any]]:
    if is_mongodb:
        cursor = db.diagnoses.find({"user_id": user_id}).sort("created_at", -1)
        results = []
        for doc in cursor:
            doc["id"] = str(doc.get("id", doc.get("_id")))
            if "_id" in doc:
                del doc["_id"]
            results.append(doc)
        return results
    else:
        import json
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM diagnoses WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for row in rows:
            d = dict(row)
            try:
                d["recommendations"] = json.loads(d["recommendations"])
            except Exception:
                d["recommendations"] = [d["recommendations"]]
            results.append(d)
        return results

# Chat Operations
def save_chat_message(user_id: str, message: str, response: str) -> Dict[str, Any]:
    chat_id = str(uuid.uuid4())
    created_at = datetime.datetime.now().isoformat()
    
    chat_data = {
        "id": chat_id,
        "user_id": user_id,
        "message": message,
        "response": response,
        "created_at": created_at
    }
    
    if is_mongodb:
        db.chats.insert_one(chat_data.copy())
    else:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO chats (id, user_id, message, response, created_at) VALUES (?, ?, ?, ?, ?)",
            (chat_id, user_id, message, response, created_at)
        )
        conn.commit()
        conn.close()
        
    return chat_data

def get_chat_history(user_id: str) -> List[Dict[str, Any]]:
    if is_mongodb:
        cursor = db.chats.find({"user_id": user_id}).sort("created_at", 1)
        results = []
        for doc in cursor:
            doc["id"] = str(doc.get("id", doc.get("_id")))
            if "_id" in doc:
                del doc["_id"]
            results.append(doc)
        return results
    else:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM chats WHERE user_id = ? ORDER BY created_at ASC", (user_id,))
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for row in rows:
            results.append(dict(row))
        return results
