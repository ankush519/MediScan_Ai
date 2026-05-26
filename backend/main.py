import os
import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, EmailStr

from backend.config import settings
import backend.database as db
import backend.auth as auth
import backend.model_engine as model_engine
import backend.pdf_generator as pdf_generator

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Scalable medical diagnosis system backend with TensorFlow Keras CNN and Grad-CAM explainability.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down to Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemas
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "doctor"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    token: str
    role: Optional[str] = "doctor"

class ChatRequest(BaseModel):
    message: str

# ----------------- AUTHENTICATION ROUTERS -----------------

@app.post(f"{settings.API_V1_STR}/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(user_in: UserSignup):
    existing_user = db.get_user_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists."
        )
    hashed_pwd = auth.get_password_hash(user_in.password)
    user = db.create_user(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role
    )
    # Generate Access Token
    token = auth.create_access_token({"sub": user["id"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }

@app.post(f"{settings.API_V1_STR}/auth/login")
def login(user_in: UserLogin):
    user = db.get_user_by_email(user_in.email)
    if not user or not auth.verify_password(user_in.password, user["hashed_password"]):
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password."
        )
    token = auth.create_access_token({"sub": user["id"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }

@app.post(f"{settings.API_V1_STR}/auth/google")
def login_google(req: GoogleLoginRequest):
    # Verify Google token
    claims = auth.authenticate_google_token(req.token)
    if not claims:
        raise HTTPException(
            status_code=401,
            detail="Invalid Google credential token."
        )
    
    email = claims["email"]
    name = claims["name"]
    
    # Check if user exists, if not, create
    user = db.get_user_by_email(email)
    if not user:
        # Register a new OAuth user with empty password
        hashed_pwd = auth.get_password_hash(os.urandom(24).hex())
        user = db.create_user(
            email=email,
            hashed_password=hashed_pwd,
            full_name=name,
            role=req.role
        )
        
    token = auth.create_access_token({"sub": user["id"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }

# ----------------- DIAGNOSIS ROUTERS -----------------

@app.post(f"{settings.API_V1_STR}/predict")
async def diagnose_scan(
    file: UploadFile = File(...),
    patient_name: str = Form("Anonymous Patient"),
    symptoms: str = Form(""),
    current_user: dict = Depends(auth.get_current_user)
):
    try:
        contents = await file.read()
        
        # Call AI model engine to evaluate the scan and generate Grad-CAM
        results = model_engine.predict_scan(contents, file.filename)
        
        # Save to database
        db.save_diagnosis(
            user_id=current_user["id"],
            patient_name=patient_name,
            symptoms=symptoms,
            prediction=results["prediction"],
            confidence=results["confidence"],
            risk_level=results["risk_level"],
            recommendations=results["recommendations"],
            original_image=results["original_image_base64"],
            heatmap_image=results["heatmap_image_base64"]
        )
        
        # Return summary findings
        return {
            "patient_name": patient_name,
            "symptoms": symptoms,
            "prediction": results["prediction"],
            "confidence": results["confidence"],
            "risk_level": results["risk_level"],
            "recommendations": results["recommendations"],
            "original_image": results["original_image_base64"],
            "heatmap_image": results["heatmap_image_base64"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during medical scan analysis: {str(e)}"
        )

@app.get(f"{settings.API_V1_STR}/history")
def get_diagnosis_history(current_user: dict = Depends(auth.get_current_user)):
    try:
        history = db.get_diagnoses_by_user(current_user["id"])
        # Format return payload (remove massive base64 image strings to make the list response snappy)
        snappy_history = []
        for h in history:
            item = h.copy()
            # Retain just a snippet of base64 or a bool indicating images exist
            item["has_images"] = bool(h.get("original_image") and h.get("heatmap_image"))
            # Keep original and heatmap images out of the index list to conserve payload bandwidth,
            # but provide them if explicitly requested
            del item["original_image"]
            del item["heatmap_image"]
            snappy_history.append(item)
        return snappy_history
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch diagnostic logs: {str(e)}"
        )

@app.get(f"{settings.API_V1_STR}/history/{{diagnosis_id}}")
def get_diagnosis_details(diagnosis_id: str, current_user: dict = Depends(auth.get_current_user)):
    # Simple check: diagnoses are fetched from the list
    history = db.get_diagnoses_by_user(current_user["id"])
    for h in history:
        if h["id"] == diagnosis_id:
            return h
    raise HTTPException(status_code=404, detail="Diagnosis record not found.")

@app.get(f"{settings.API_V1_STR}/history/pdf/{{diagnosis_id}}")
def download_report_pdf(diagnosis_id: str, current_user: dict = Depends(auth.get_current_user)):
    history = db.get_diagnoses_by_user(current_user["id"])
    target_diag = None
    for h in history:
        if h["id"] == diagnosis_id:
            target_diag = h
            break
            
    if not target_diag:
        raise HTTPException(status_code=404, detail="Diagnosis record not found.")
        
    try:
        # Generate Report PDF bytes
        pdf_data = pdf_generator.generate_pdf_report(
            patient_name=target_diag["patient_name"],
            symptoms=target_diag["symptoms"],
            prediction=target_diag["prediction"],
            confidence=target_diag["confidence"],
            risk_level=target_diag["risk_level"],
            recommendations=target_diag["recommendations"],
            original_base64=target_diag["original_image"],
            heatmap_base64=target_diag["heatmap_image"],
            created_at=target_diag["created_at"]
        )
        
        # Return Streaming PDF response
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=mediscan_report_{diagnosis_id[:8]}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to build PDF report: {e}")

# ----------------- AI MEDICAL CHAT ROUTERS -----------------

@app.post(f"{settings.API_V1_STR}/chat")
def consult_chat_assistant(req: ChatRequest, current_user: dict = Depends(auth.get_current_user)):
    user_msg = req.message.strip()
    ai_response = ""
    
    def clean_markdown(text: str) -> str:
        import re
        if not text:
            return ""
        # Remove bold markers **text** or __text__ -> text
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
        text = re.sub(r'__([^_]+)__', r'\1', text)
        # Remove italic markers *text* or _text_ -> text
        text = re.sub(r'\*([^*]+)\*', r'\1', text)
        text = re.sub(r'_([^_]+)_', r'\1', text)
        # Remove heading markers: ### text -> text (uppercase)
        def clean_heading(match):
            heading = match.group(3).strip()
            return f"\n{heading.upper()}\n"
        text = re.sub(r'^(\s*)(#+)(.+)$', clean_heading, text, flags=re.MULTILINE)
        # Clean bullet points: * list -> • list, - list -> • list
        text = re.sub(r'^(\s*)[-*+]\s+', r'\1• ', text, flags=re.MULTILINE)
        # Remove any stray markdown syntax characters like #, *, _
        text = text.replace('*', '').replace('#', '').replace('_', '')
        # Normalize excessive newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    # 1. Try Google Gemini API if key is available
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Setup model and chat
            try:
                print("Attempting to generate content using gemini-3.5-flash...")
                model = genai.GenerativeModel('gemini-3.5-flash')
                system_prompt = (
                    "You are MediScan AI, an expert clinical AI medical chatbot assistant designed for physicians. "
                    "You provide medically accurate, highly professional answers about diagnoses, symptom analysis, "
                    "precautions, and clinical definitions. Make your replies structured, neat, and highly medical. "
                    "Always place a small clinical disclaimer at the bottom stating that your feedback is for decision-support purposes only.\n\n"
                    "CRITICAL FORMATTING INSTRUCTION: Do NOT use markdown symbols in your output. Do NOT write hashes (#), "
                    "stars/asterisks (*, **), underscores (_), or line bars (-). Instead, format headers using ALL CAPS "
                    "and clean vertical spacing. For bullet lists, use plain lists or standard indentation. Keep it clean and readable."
                )
                response = model.generate_content(f"{system_prompt}\n\nUser Question: {user_msg}")
                ai_response = clean_markdown(response.text)
                print("Successfully generated content using gemini-3.5-flash.")
            except Exception as e1:
                print(f"Gemini gemini-3.5-flash failed ({e1}). Retrying with gemini-2.5-flash...")
                try:
                    model = genai.GenerativeModel('gemini-2.5-flash')
                    system_prompt = (
                        "You are MediScan AI, an expert clinical AI medical chatbot assistant designed for physicians. "
                        "You provide medically accurate, highly professional answers about diagnoses, symptom analysis, "
                        "precautions, and clinical definitions. Make your replies structured, neat, and highly medical. "
                        "Always place a small clinical disclaimer at the bottom stating that your feedback is for decision-support purposes only.\n\n"
                        "CRITICAL FORMATTING INSTRUCTION: Do NOT use markdown symbols in your output. Do NOT write hashes (#), "
                        "stars/asterisks (*, **), underscores (_), or line bars (-). Instead, format headers using ALL CAPS "
                        "and clean vertical spacing. For bullet lists, use plain lists or standard indentation. Keep it clean and readable."
                    )
                    response = model.generate_content(f"{system_prompt}\n\nUser Question: {user_msg}")
                    ai_response = clean_markdown(response.text)
                    print("Successfully generated content using gemini-2.5-flash.")
                except Exception as e2:
                    print(f"Gemini gemini-2.5-flash fallback failed too: {e2}")
                    raise e2
        except Exception as e:
            print(f"Gemini API chat call failed entirely: {e}. Defaulting to expert chatbot.")
            ai_response = ""
            
    # 2. Expert System Chatbot Fallback
    if not ai_response:
        msg_lower = user_msg.lower()
        
        # Check symptoms and return clinical feedback
        if "cough" in msg_lower or "fever" in msg_lower or "breath" in msg_lower or "pneumonia" in msg_lower:
            ai_response = (
                "CLINICAL GUIDANCE: RESPIRATORY EVALUATION\n\n"
                "Based on the respiratory symptoms described (cough, fever, or dyspnea), we must consider active pulmonary inflammation or infections such as pneumonia, bronchitis, or viral syndromes (e.g. COVID-19/Influenza).\n\n"
                "RECOMMENDED PRECAUTIONS & DIRECTIVES:\n"
                "• Radiographic Workup: Ensure a recent Chest X-ray (PA view) is uploaded to the MediScan portal to evaluate for patch consolidations.\n"
                "• Vitals Monitoring: Perform regular assessments of SpO2 (oxygen saturation). Levels falling below 94% require acute clinical assessment.\n"
                "• Isolation & Hydration: Rest, increase intake of warm fluids, and isolate to prevent potential transmission.\n\n"
                "Disclaimer: Decision support advice only. Please correlate with hands-on auscultation."
            )
        elif "chest pain" in msg_lower or "heart" in msg_lower:
            ai_response = (
                "CLINICAL EMERGENCY ALERT: CARDIOVASCULAR SYMPTOMS\n\n"
                "CAUTION: Chest pain or cardiovascular distress can be indicative of acute coronary syndrome (ACS), myocardial infarction, or pulmonary embolism.\n\n"
                "URGENT STEPS:\n"
                "• Emergency Evaluation: If the pain is crushing, radiates to the left arm or jaw, or is accompanied by cold sweat, immediately dial 911 or visit the nearest Emergency Department.\n"
                "• ECG & Biomarkers: A 12-lead Electrocardiogram (ECG) and Troponin level checks are critical first-line interventions.\n\n"
                "Disclaimer: Emergency support guide. Consult emergency services immediately."
            )
        elif "headache" in msg_lower or "migraine" in msg_lower:
            ai_response = (
                "CLINICAL GUIDANCE: NEUROLOGICAL HEADACHE EVALUATION\n\n"
                "Headaches can range from primary conditions (tension, migraine) to secondary etiologies (hypertension, sinus pressure, or intracranial pressure).\n\n"
                "RECOMMENDED PRECAUTIONS:\n"
                "• Check Vitals: Monitor blood pressure to exclude hypertensive crisis.\n"
                "• Rest & Dark Environment: For migraine-like symptoms, resting in a quiet, dark room and keeping hydrated helps.\n"
                "• Red Flags: Sudden onset 'thunderclap' headaches, or headaches accompanied by stiff neck, fever, or confusion require immediate emergency attention.\n\n"
                "Disclaimer: Educational guidance only. Consult a neurologist for persistent symptoms."
            )
        else:
            ai_response = (
                f"MEDISCAN CLINICAL SUPPORT\n\n"
                f"Thank you for contacting MediScan AI. I am ready to assist with symptom assessment, drug interaction notes, and diagnostic queries.\n\n"
                f"Regarding your inquiry about '{user_msg}', I recommend outlining specific symptoms (e.g. vitals, severity, onset) so I can provide structured clinical references.\n\n"
                f"GENERAL RECOMMENDATIONS:\n"
                f"• Upload relevant chest radiographs to our Scan Diagnosis tab for rapid visual density mapping.\n"
                f"• Track key vitals (heart rate, blood pressure, oxygen saturation) in the system.\n\n"
                f"Disclaimer: Automated decision support output. Please consult a licensed medical practitioner."
            )
            
    # Save chat record
    db.save_chat_message(
        user_id=current_user["id"],
        message=user_msg,
        response=ai_response
    )
    
    return {
        "message": user_msg,
        "response": ai_response,
        "created_at": datetime.datetime.now().isoformat()
    }

@app.get(f"{settings.API_V1_STR}/chat/history")
def get_chat_history_list(current_user: dict = Depends(auth.get_current_user)):
    try:
        return db.get_chat_history(current_user["id"])
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve conversation logs: {str(e)}"
        )

# Startup verification
@app.get("/")
def home():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "time": datetime.datetime.now().isoformat(),
        "database_engine": "MongoDB Atlas" if db.is_mongodb else "SQLite Local"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
