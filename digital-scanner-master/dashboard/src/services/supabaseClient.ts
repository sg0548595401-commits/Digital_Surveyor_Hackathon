import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface CustomerPayload {
  insurance_details: {
    insurance_target: string;
    is_mortgage_required: string;
  };
  property_description: {
    property_type: string;
    property_specs: {
      square_meters: number;
      number_of_rooms: number;
      construction_standard: string;
    };
    property_additions: string[];
  };
  personal_details: {
    first_name: string;
    last_name: string;
    id_number: string;
    full_name?: string;
  };
  claims_and_refusals: {
    has_insurance_refusal_history: string;
    claims_last_3_years: {
      had_damages: string;
    };
  };
}

export interface UnderwritingDecision {
  fact_checking_reasoning: string;
  final_risk_level: 'green' | 'yellow' | 'red';
  has_coverage_gap: boolean;
  underwriter_summary: string;
}

export interface Case {
  id: string;
  status: string;
  customer_payload: CustomerPayload;
  
  // השדות האלו עכשיו שטוחים, בדיוק כמו ב-SQL שלך:
  final_risk_level?: 'green' | 'yellow' | 'red';
  has_coverage_gap?: boolean;
  underwriter_summary?: string;
  manager_notes?: string; // הוספתי לפי ה-SQL שלך
  
  created_at?: string; 
}

// פונקציה לשליפת תיקים הממתינים לבדיקה
export const fetchPendingCases = async (): Promise<Case[]> => {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    // שינינו את הפילטר כדי שיציג את הסטטוסים שבאמת קיימים אצלך בבאקנד
    .in('status', ['collecting_images', 'needs_human_review', 'pending'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cases:', error);
    throw error;
  }
  
  return data as Case[];
};

// שליפת תיק ספציפי לפי ID
export const fetchCaseById = async (id: string): Promise<Case | null> => {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching case:', error);
    throw error;
  }
  
  return data as Case;
};

// --- פונקציה לעדכון סטטוס התיק (לאישור/דחייה) ---
export const updateCaseStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'investigation_needed'): Promise<void> => {
  const { error } = await supabase
    .from('cases')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    console.error('Error updating case status:', error);
    throw new Error('שגיאה בעדכון הסטטוס במסד הנתונים');
  }
};

// --- הגדרות ופונקציה לשליפת ניתוחי תמונות מה-AI ---
export interface ImageAnalysis {
  id: string;
  category: string;
  image_url: string;
  ai_analysis_result: {
    summary: string;
    risk_alerts: string[];
    property_gaps: {
      item_name: string;
      was_reported: boolean;
      gap_description: string;
      confidence_score: number;
      represents_coverage_gap: boolean;
    }[];
    visual_anchors: {
      description: string;
      feature_type: string;
    }[];
    traffic_light_status: 'green' | 'yellow' | 'red';
  };
}

export const fetchImageAnalyses = async (caseId: string): Promise<ImageAnalysis[]> => {
  const { data, error } = await supabase
    .from('image_analyses')
    .select('*')
    .eq('case_id', caseId);

  if (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
  
  return data as ImageAnalysis[];
};