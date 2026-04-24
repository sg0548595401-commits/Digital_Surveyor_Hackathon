import requests
import json
import os
import time  # <-- הוספנו את זה
BASE_URL = "http://localhost:8000"

IMAGES_TO_UPLOAD = {
    "דלת כניסה": "test_door.png",
    "מטבח": "test_kitchen.png",
    "סלון": "test_living_room.png",
    "חדרי שינה": "test_bedroom.png",
    "צילום הדירה מבחוץ": "test_exterior.png",
    "גינה": "test_yard.png"
}

def run_full_test():
    print("🚀 מתחילים טסט מלא למערכת החיתום (תרחיש יוקרה מזויפת)...\n")
    
    # ה-JSON של הלקוח המצהיר על סטנדרט גבוה
    customer_data = {
        "insurance_details": {
            "insurance_target": "מבנה ותכולה",
            "is_mortgage_required": "לא",
            "previous_customer": "לא"
        },
        "property_description": {
            "property_type": "בית פרטי",
            "address": {
                "city": "רעננה",
                "street": "אחוזה",
                "house_number": 45
            },
            "construction": {
                "is_standard_concrete_blocks": "כן",
                "alternative_materials_selection": ""
            },
            "property_specs": {
                "square_meters": 160,
                "number_of_rooms": 4,
                "property_age_years": 5,
                "construction_standard": "גבוה מהרגיל",
                "number_of_tenants": 3,
                "is_residential_only": "כן"
            },
            "property_additions": []
        },
        "personal_details": {
            "insurance_start_date": "2024-06-01",
            "owner_title": "בעל הבית",
            "first_name": " -1לא נטפרי  ",
            "last_name": "אחרי שינוי מודל",
            "id_number": "987654321",
            "email": "t@example.com"
        },
        "claims_and_refusals": {
            "has_insurance_refusal_history": "לא",
            "claims_last_3_years": {
                "had_damages": "לא"
            }
        }
    }

    # --- שלב 1: פתיחת תיק ---
    print("📁 פותח תיק חדש בסופבייס...")
    response = requests.post(f"{BASE_URL}/create-case", json={"customer_payload": customer_data})
    if response.status_code != 200:
        print(f"❌ שגיאה בפתיחת תיק: {response.text}")
        return
        
    case_id = response.json().get("case_id")
    print(f"✅ תיק נוצר בהצלחה! ID: {case_id}\n")

# --- שלב 2: סריקת כל התמונות בלולאה (גרסת הפרודקשן המהירה!) ---
    for category, filename in IMAGES_TO_UPLOAD.items():
        if not os.path.exists(filename):
            print(f"⚠️ מדלג על '{category}': הקובץ {filename} לא נמצא בתיקייה.\n")
            continue
            
        print(f"📸 מעלה תמונה לניתוח: {category} ({filename})...")
        
        with open(filename, "rb") as img:
            files_payload = {"image": (filename, img, "image/png")}
            data_payload = {
                "case_id": case_id, 
                "category": category, 
                "survey_data": json.dumps(customer_data)
            }
            
            res_image = requests.post(f"{BASE_URL}/analyze-image", data=data_payload, files=files_payload)
            
            if res_image.status_code == 200:
                print(f"✅ תוצאת AI ל-{category}:")
                print(json.dumps(res_image.json().get('message'), ensure_ascii=False))
                print("-" * 50 + "\n")
            else:
                print(f"❌ שגיאה מהשרת ({res_image.status_code}): {res_image.text}\n")
                continue

    # --- שלב 3: סיכום התיק ---
    print("⚖️ מפעיל את סוכן החיתום המסכם...")
    final_res = requests.post(f"{BASE_URL}/finalize-case", data={"case_id": case_id})
    
    if final_res.status_code != 200:
        print(f"❌ שגיאה בסיכום התיק: {final_res.text}")
        return
        
    decision = final_res.json().get("decision")
    print("\n" + "=" * 50)
    print(" 📑 החלטת סוכן החיתום הסופית ")
    print("=" * 50)
    print(f"🚦 רמזור: {decision.get('final_risk_level').upper()}")
    print(f"🔍 תת-ביטוח (פערים בשטח): {decision.get('has_coverage_gap')}")
    print(f"📝 עובדות שהוצלבו:\n{decision.get('fact_checking_reasoning')}")
    print(f"👨‍💼 סיכום למנהל:\n{decision.get('underwriter_summary')}")
    print("=" * 50 + "\n")

if __name__ == "__main__":
    run_full_test()