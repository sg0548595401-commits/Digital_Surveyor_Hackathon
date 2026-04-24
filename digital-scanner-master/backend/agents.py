import os
import json
from PIL import Image
from pydantic import ValidationError

from llama_index.core import Settings, PromptTemplate
from llama_index.core.workflow import Workflow, StartEvent, StopEvent, step

# ה-SDK הרשמי של ג'מיני לעבודה עם תמונות
from google import genai
from google.genai import types

# ה-LLM של LlamaIndex עבור החתם המסכם
from llama_index.llms.google_genai import GoogleGenAI

from schemas import SurveyAnalysisResult, UnderwritingDecision, ImageAnalyzedEvent
from prompts import INSTRUCTIONS_MAP, get_vision_prompt, get_underwriter_prompt
from dotenv import load_dotenv

load_dotenv()

# הגדרת מפתח API מאוחד כדי למנוע כפילויות
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

# אתחול הלקוחות
gemini_client = genai.Client(api_key=API_KEY)

llm_text = GoogleGenAI(
    model="gemini-2.5-flash", # נשארים עם הגרסה שלך!
    api_key=API_KEY,
    max_tokens=8192
)  
Settings.llm = llm_text


class SingleImageAnalyzerWorkflow(Workflow):
    @step
    async def analyze_image_step(self, ev: StartEvent) -> StopEvent:
        image_path = ev.get("image_path")
        category = ev.get("category") 
        survey_data = ev.get("survey_data")
        # הוספת סוג הפוליסה (מבנה/תכולה) מהאירוע
        policy_type = ev.get("policy_type", "both")
        
        # התאמת הוראות לפי קטגוריה (תומך גם בחדר שינה 1, 2 וכו')
        base_category = "חדר שינה" if "חדר שינה" in category else category
        default_instruction = "סרוק את התמונה לאיתור חריגות, רטיבות, תכולה ומצב תחזוקה."
        category_instructions = INSTRUCTIONS_MAP.get(base_category, default_instruction)

        # מעבר לפרומפט המעודכן שקיבל את הפרמטר policy_type
        dynamic_prompt = get_vision_prompt(category, survey_data, category_instructions, policy_type)
        
        try:
            img = Image.open(image_path)
            
            response = gemini_client.models.generate_content(
                model='gemini-2.5-flash', # נשארים עם הגרסה שלך!
                contents=[img, dynamic_prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SurveyAnalysisResult,
                    temperature=0.3, 
                    max_output_tokens=8192
                ),
            )
            
            parsed_result = SurveyAnalysisResult.model_validate_json(response.text)
            
            final_event = ImageAnalyzedEvent(image_category=category, analysis_result=parsed_result)
            return StopEvent(result=final_event)
            
        except Exception as e:
            print(f"Error in Vision Agent: {str(e)}")
            # --- כאן תיקנו את הבאג: הוספנו את השדה property_tier כדי שהשרת לא יקרוס ---
            fallback_result = SurveyAnalysisResult(
                is_image_clear=False,
                is_category_match=True, 
                blur_score=0.0,
                property_tier="standard", # הוספנו את זה!
                detected_anomalies=[],
                visual_anchors=[],
                property_gaps=[],
                risk_alerts=[],
                summary=f"התמונה התקבלה אך יש עומס זמני בשרתי הניתוח. השגיאה: {str(e)}"
            )
            final_event = ImageAnalyzedEvent(image_category=category, analysis_result=fallback_result)
            return StopEvent(result=final_event)
    

class UnderwriterWorkflow(Workflow):
    @step
    async def evaluate_case(self, ev: StartEvent) -> StopEvent:
        customer_payload = ev.get("customer_payload")
        all_images_data = ev.get("all_images_data") 
        
        formatted_report = ""
        if isinstance(all_images_data, list):
            for image_record in all_images_data: 
                category = image_record.get("category", "לא ידוע")
                raw_result = image_record.get("ai_analysis_result", {})
                try:
                    # טעינת הנתונים לתוך ה-Schema שלנו
                    parsed_result = SurveyAnalysisResult(**raw_result)
                    
                    anomalies_texts = ", ".join(parsed_result.detected_anomalies) if parsed_result.detected_anomalies else "אין"
                    
                    formatted_report += f"\n📍 קטגוריה: {category}\n"
                    formatted_report += f"   - רמת נכס/סיכום: {parsed_result.summary}\n"
                    formatted_report += f"   - חריגים שנמצאו: {anomalies_texts}\n"
                    
                    # בניית רשימת פערים (בריכות, פרגולות וכו')
                    gaps_texts = [f"{gap.item_name}: {gap.gap_description}" for gap in parsed_result.property_gaps]
                    formatted_report += f"   - פערים ותת-ביטוח: {', '.join(gaps_texts) if gaps_texts else 'לא נמצאו פערים'}\n"
                    
                    # בניית רשימת התראות סיכון (רטיבות, חשמל)
                    alerts_texts = [f"[{alert.alert_level.upper()}] {alert.reason}" for alert in parsed_result.risk_alerts]
                    formatted_report += f"   - התראות בטיחות: {', '.join(alerts_texts) if alerts_texts else 'תקין'}\n"
                    
                    # עוגנים ויזואליים
                    anchors_texts = [f"{anchor.feature_type}: {anchor.description}" for anchor in parsed_result.visual_anchors]
                    formatted_report += f"   - עוגנים לזיהוי הנכס: {', '.join(anchors_texts) if anchors_texts else 'אין'}\n"
                    
                except Exception as e:
                    formatted_report += f"\n📍 קטגוריה: {category} (שגיאה בעיבוד נתוני ה-AI עבור חדר זה)\n"
        else:
            formatted_report = str(all_images_data)

        # יצירת הפרומפט הסופי לחתם
        prompt_str = get_underwriter_prompt(customer_payload, formatted_report)
        prompt_template = PromptTemplate(prompt_str)
        
        # החלטה סופית מבוססת JSON
        response = await llm_text.astructured_predict(UnderwritingDecision, prompt_template)
        
        return StopEvent(result=response)