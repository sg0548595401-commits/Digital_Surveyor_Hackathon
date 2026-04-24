from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
import aiofiles
import os
import uvicorn
import logging

from database import supabase
from schemas import CaseCreateRequest
from agents import SingleImageAnalyzerWorkflow, UnderwriterWorkflow

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vision_agent = SingleImageAnalyzerWorkflow(timeout=300.0)
underwriter_agent = UnderwriterWorkflow(timeout=300.0)

@app.post("/create-case")
async def create_case_endpoint(request: CaseCreateRequest):
    logger.info("מתחיל יצירת תיק חדש...")
    try:
        new_case_id = str(uuid.uuid4())
        if not request.customer_payload:
            raise HTTPException(status_code=400, detail="נתוני הלקוח חסרים")

        payload = request.customer_payload
        prop_desc = payload.get("property_description", {})
        
        # --- בניית רשימת חדרים דינמית ---
        required_rooms = ["דלת כניסה", "סלון", "מטבח"]
        
        try:
            rooms_count = int(prop_desc.get("rooms_count", 1))
        except (ValueError, TypeError):
            rooms_count = 1
            
        # תיקון 1: מיספור חכם - חדר אחד נקCalled "חדר שינה", יותר מחדר אחד עובר למיספור
        if rooms_count == 1:
            required_rooms.append("חדר שינה")
        else:
            for i in range(1, rooms_count + 1):
                required_rooms.append(f"חדר שינה {i}")
        
        # חדרים נוספים לפי סוג הנכס
        prop_type = prop_desc.get("property_type", "")
        if prop_type in ["בית פרטי", "דו משפחתי\\טורי"]:
            required_rooms.extend(["צילום הדירה מבחוץ", "גינה"])
            
        # תוספות מיוחדות
        additions = str(prop_desc.get("property_additions", []))
        if "מחסן" in additions: required_rooms.append("מחסן")
        if "מרפסת" in additions: required_rooms.append("מרפסת")
        if "פרגולה" in additions: required_rooms.append("פרגולה")

        # שמירה ב-Supabase
        supabase.table("cases").insert({
            "id": new_case_id,
            "customer_payload": payload,
            "status": "collecting_images"
        }).execute()

        logger.info(f"תיק חדש נוצר בהצלחה: {new_case_id} עם {len(required_rooms)} חדרים נדרשים")
        return {
            "status": "success", 
            "case_id": new_case_id, 
            "required_rooms": required_rooms
        }
        
    except Exception as e:
        logger.error(f"שגיאה ביצירת תיק: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-image")
async def analyze_image_endpoint(case_id: str = Form(...), category: str = Form(...), image: UploadFile = File(...)):
    logger.info(f"ניתוח תמונה עבור: {category} בתיק: {case_id}")
    
    case_response = supabase.table("cases").select("customer_payload").eq("id", case_id).execute()
    if not case_response.data:
        raise HTTPException(status_code=404, detail="התיק לא נמצא")
    
    payload_data = case_response.data[0]["customer_payload"]
    survey_data = str(payload_data)
    
    policy_type = payload_data.get("insurance_type", "both")
    
    temp_file_path = f"temp_{uuid.uuid4()}_{image.filename}"
    
    try:
        # שמירת קובץ זמני
        content = await image.read()
        async with aiofiles.open(temp_file_path, 'wb') as f: 
            await f.write(content)
        
        # הפעלת ה-AI
        result_event = await vision_agent.run(
            image_path=temp_file_path, 
            category=category, 
            survey_data=survey_data,
            policy_type=policy_type
        )
        analysis_data = result_event.analysis_result
        
        # --- התיקון הספציפי: החלפת ה-raise ב-return מסודר ---
        if not analysis_data.is_category_match:
            logger.warning(f"חוסר תאימות: התמונה אינה נראית כמו {category}")
            return {
                "status": "retry_required", 
                "success": False,
                "message": f"אהלן, נא להעלות תמונה נוספת של {category}, התמונה הקודמת לא זוהתה כראוי.",
                "ai_details": analysis_data.model_dump()
            }

        # העלאה ל-Storage
        storage_path = f"{case_id}/{uuid.uuid4()}.jpg"
        with open(temp_file_path, "rb") as f:
            supabase.storage.from_("property-images").upload(path=storage_path, file=f)
        
        # שמירת תוצאות הניתוח במסד הנתונים
        public_url = supabase.storage.from_("property-images").get_public_url(storage_path)
        supabase.table("image_analyses").insert({
            "case_id": case_id, 
            "category": category, 
            "image_url": str(public_url), 
            "ai_analysis_result": analysis_data.model_dump()
        }).execute()
        
        return {"status": "success", "image_url": str(public_url)}
        
    except Exception as e: 
        logger.error(f"שגיאה בניתוח תמונה: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path): 
            os.remove(temp_file_path)

@app.post("/finalize-case")
async def finalize_case_endpoint(case_id: str = Form(...)):
    logger.info(f"מבצע חיתום סופי לתיק: {case_id}")
    try:
        case_res = supabase.table("cases").select("customer_payload").eq("id", case_id).single().execute()
        imgs_res = supabase.table("image_analyses").select("category, ai_analysis_result").eq("case_id", case_id).execute()
        
        # הרצת סוכן החיתום
        decision = await underwriter_agent.run(
            customer_payload=str(case_res.data["customer_payload"]), 
            all_images_data=imgs_res.data
        )
        
        # עדכון הסטטוס והחלטת החיתום
        supabase.table("cases").update({
            "final_risk_level": decision.final_risk_level, 
            "has_coverage_gap": decision.has_coverage_gap,
            "underwriter_summary": decision.underwriter_summary, 
            "status": "approved" 
        }).eq("id", case_id).execute()
        
        return {"status": "success", "decision": decision.model_dump()}
        
    except Exception as e: 
        logger.error(f"שגיאה בחיתום סופי: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)