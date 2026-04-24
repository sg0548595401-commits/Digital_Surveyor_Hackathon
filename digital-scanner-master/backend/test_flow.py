import requests
import json

BASE_URL = "http://localhost:8000"

def run_test():
    print(" מתחילים טסט מקצה לקצה למערכת החיתום...\n")
   
    # הנתונים שהלקוח הזין בצ'אט לפי הסכמה החדשה
    # שימי לב: המערך property_additions ריק כדי לדמות שהלקוח לא מצהיר על גינה!
    customer_data = {
        "insurance_details": {
            "insurance_target": "מבנה ותכולה",
            "is_mortgage_required": "לא"
        },
        "property_description": {
            "property_type": "בית פרטי",
            "property_specs": {
                "square_meters": 120,
                "number_of_rooms": 4,
                "construction_standard": "רגיל"
            },
            "property_additions": []
        },
        "personal_details": {
            "first_name": "ישראל",
            "last_name": "ישראלי",
            "id_number": "123456789"
        },
        "claims_and_refusals": {
            "has_insurance_refusal_history": "לא",
            "claims_last_3_years": {"had_damages": "לא"}
        }
    }

    # --- שלב 1: פתיחת תיק ---
    print(" פותח תיק חדש בסופבייס...")
    response = requests.post(f"{BASE_URL}/create-case", json={"customer_payload": customer_data})
    case_id = response.json().get("case_id")
    print(f" תיק נוצר בהצלחה! ID: {case_id}\n")

# --- שלב 2: העלאת תמונת מטבח ---
    print(" מעלה תמונת מטבח לניתוח (זה ייקח כמה שניות ל-AI לקרוא)...")
    with open("test_kitchen.png", "rb") as img:
        res_kitchen = requests.post(
            f"{BASE_URL}/analyze-image",
            data={"case_id": case_id, "category": "מטבח", "survey_data": json.dumps(customer_data)},
            files={"image": img}
        )

    # ---> כאן אנחנו מוסיפים את הבדיקה <---
    if res_kitchen.status_code != 200:
        print(f"שגיאה מהשרת (סטטוס {res_kitchen.status_code}): {res_kitchen.text}")
        return # עוצרים את הפונקציה כדי לא להמשיך ולקרוס

    print(f" תוצאת מטבח: {res_kitchen.json().get('message')}")
    print(f" לינק בסופבייס: {res_kitchen.json().get('image_url')}\n")
    # ... המשך הקוד המקורי שלך ...
    print(" פירוט ממצאי ה-AI (מטבח):")
    
    # שולפים את ה-JSON מהתשובה ומדפיסים אותו מסודר עם הזחות (indent)
    print(json.dumps(res_kitchen.json(), indent=4, ensure_ascii=False))
    print("-" * 40 + "\n")

    # --- שלב 3: העלאת תמונת גינה ---
    print(" מעלה תמונת חצר (בואי נראה אם ה-AI יתפוס את השקר)...")
    with open("test_yard.png", "rb") as img:
        res_yard = requests.post(
            f"{BASE_URL}/analyze-image",
            data={"case_id": case_id, "category": "גינה", "survey_data": json.dumps(customer_data)},
            files={"image": img}
        )
    print(f" תוצאת חצר: {res_yard.json().get('message')}\n")
    print(" פירוט ממצאי ה-AI (חצר):")
    print(json.dumps(res_yard.json(), indent=4, ensure_ascii=False))
    print("-" * 40 + "\n")

    # --- שלב 4: סיכום התיק ע"י סוכן החיתום ---
    print(" מפעיל את סוכן החיתום לסיכום התיק...")
    final_res = requests.post(
        f"{BASE_URL}/finalize-case",
        data={"case_id": case_id}
    )
   
    decision = final_res.json().get("decision")
    print("\n --- החלטת סוכן החיתום הסופית ---")
    print(f" רמזור: {decision.get('final_risk_level')}")
    print(f" פוטנציאל הרחבת כיסוי (תת-ביטוח): {decision.get('has_coverage_gap')}")
    print(f" סיכום למנהל: {decision.get('underwriter_summary')}")

if __name__ == "__main__":
    run_test()