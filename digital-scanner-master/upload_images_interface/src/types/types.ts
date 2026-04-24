
export interface PropertyDescription {
  property_type?: string;
  property_additions?: string[];
  [key: string]: any; 
}

export interface CustomerPayload {
  customer_name?: string;
  property_description?: PropertyDescription;
  [key: string]: any;
}

export type RoomCategory = 
  | "מחסן"
  | "פרגולה"
  | "מרפסת"
  | "גינה"
  | "חדרי שינה"
  | "סלון"
  | "מטבח"
  | "דלת כניסה"
  | "צילום הדירה מבחוץ"
  | "כניסה לבניין";

// --- 3. טייפים לתוצאות ניתוח ה-AI מהשרת ---
export type TrafficLightStatus = 'green' | 'yellow' | 'red';

export interface VisualAnchor {
  feature_type: string;
  description: string;
}

export interface PropertyGap {
  item_name: string;
  was_reported: boolean;
  gap_description: string;
  confidence_score: number;
  represents_coverage_gap: boolean;
}

export interface RiskAlert {
  alert_level: 'low' | 'medium' | 'high';
  reason: string;
}

export interface SurveyAnalysisResult {
  traffic_light_status: TrafficLightStatus;
  visual_anchors: VisualAnchor[];
  property_gaps: PropertyGap[];
  risk_alerts: RiskAlert[];
  summary: string;
  is_image_clear?: boolean;
}

// --- 4. טייפ לניהול התיק בסטייט של האפליקציה ---
export interface CaseState {
  caseId: string | null;
  requiredRooms: RoomCategory[];
  currentStatus: 'setup' | 'uploading' | 'finished';
}