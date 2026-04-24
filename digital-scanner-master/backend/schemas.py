from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from llama_index.core.workflow import Event

class VisualAnchor(BaseModel):
    feature_type: str = Field(description="סוג העוגן (ריצוף, משקוף, דגם מכשיר חשמל)")
    description: str = Field(description="תיאור פיזי מדויק של העוגן כולל צבע וחומר")

class PropertyGap(BaseModel):
    item_name: str = Field(description="הפריט שזוהה (בריכה, פרגולה, כספת וכו')")
    was_reported: bool = Field(description="האם מופיע בהצהרת הלקוח?")
    gap_description: str = Field(description="תיאור הפער (למשל: זוהתה כספת שלא דווחה)")
    represents_coverage_gap: bool = Field(description="האם זה יוצר תת-ביטוח?")

class RiskAlert(BaseModel):
    alert_level: str = Field(description="low, medium, high")
    reason: str = Field(description="סיבת הסיכון (רטיבות, חשמל חשוף וכו')")

class SurveyAnalysisResult(BaseModel):
    is_image_clear: bool = Field(description="האם התמונה חדה ומוארת?")
    is_category_match: bool = Field(description="האם התמונה תואמת לקטגוריה (ולא נוף/אדם)?")
    blur_score: float = Field(description="ציון טשטוש 0-1")
    property_tier: Literal["standard", "upgraded", "luxury"] = Field(description="דירוג רמת הנכס והתכולה שנראתה")
    detected_anomalies: List[str] = Field(default_factory=list, description="רשימת חריגויות (סדקים, עובש וכו')")
    visual_anchors: List[VisualAnchor] = Field(default_factory=list)
    property_gaps: List[PropertyGap] = Field(default_factory=list)
    risk_alerts: List[RiskAlert] = Field(default_factory=list)
    summary: str = Field(description="סיכום חופשי של ממצאי הסריקה (תכולה, חשמל, ומצב כללי)")

class UnderwritingDecision(BaseModel):
    fact_checking_reasoning: str = Field(description="נימוק חיתומי קצר המצליב בין ההצהרה לממצאים")
    final_risk_level: Literal["green", "yellow", "red"] = Field(description="רמזור סופי לקבלת התיק")
    has_coverage_gap: bool = Field(description="האם נמצא פער ביטוחי (תת-ביטוח)?")
    requires_manual_review: bool = Field(default=False, description="האם נדרשת בדיקה אנושית (למשל עבור תכשיטים/כספת)")
    underwriter_summary: str = Field(description="סיכום מנהלים חריף (עד 15 מילים)")

class ImageAnalyzedEvent(Event):
    image_category: str 
    analysis_result: SurveyAnalysisResult 

class CaseCreateRequest(BaseModel):
    customer_payload: dict