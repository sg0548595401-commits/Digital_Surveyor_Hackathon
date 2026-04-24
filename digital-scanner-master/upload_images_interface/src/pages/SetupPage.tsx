import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  TextField, 
  Paper, 
  CircularProgress, 
  Alert 
} from '@mui/material';
import { apiClient } from '../api/apiClient';
import {type RoomCategory } from '../types/types';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CodeIcon from '@mui/icons-material/Code';

interface SetupPageProps {
  onSetupComplete: (caseId: string, requiredRooms: RoomCategory[]) => void;
}

const SAMPLE_JSON = JSON.stringify({
  customer_name: "ישראל ישראלי",
  property_description: {
    property_type: "בית פרטי",
    property_additions: ["מחסן", "פרגולה"]
  }
}, null, 2);

export const SetupPage: React.FC<SetupPageProps> = ({ onSetupComplete }) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartCase = async () => {
    setError(null);
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonInput);
    } catch (e) {
      setError("שגיאה: ה-JSON שהוזן אינו תקין. אנא בדוק חסרים פסיקים או סוגריים.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.createCase(parsedData);
      
      if (response.status === 'success' && response.case_id) {
        onSetupComplete(response.case_id, response.required_rooms);
      } else {
        setError(response.message || "שגיאה לא ידועה בפתיחת התיק בשרת.");
      }
    } catch (err: any) {
      setError(err.message || "שגיאת תקשורת מול השרת. האם ה-FastAPI רץ?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        p: 2,
        bgcolor: 'background.default' 
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          maxWidth: 600, 
          width: '100%', 
          borderRadius: 4,
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }} gutterBottom>
          הקמת תיק ביטוח (דמו)
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          הדבק כאן את תגובת השאלון של הלקוח (בפורמט JSON) כדי להפיק רשימת צילום דינמית לזיהוי פערים.
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={8}
          variant="outlined"
          placeholder="{'customer_name': '...'}"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          sx={{ 
            mb: 2, 
            direction: 'ltr',
            // הדרך התקנית ב-MUI לעצב את הטקסט בתוך התיבה
            '& .MuiInputBase-input': { 
              fontFamily: 'monospace', 
              fontSize: '0.9rem' 
            }
          }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          
          <Button
            variant="contained"
            color="primary"
            size="large"
            endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <RocketLaunchIcon />}
            onClick={handleStartCase}
            disabled={!jsonInput.trim() || isLoading}
            sx={{ width: '100%', maxWidth: 300 }}
          >
            {isLoading ? 'פותח תיק בשרת...' : 'התחל סריקה דיגיטלית'}
          </Button>

         <Button
            variant="text"
            color="secondary"
            startIcon={<CodeIcon />}
            onClick={() => setJsonInput(SAMPLE_JSON)}
            sx={{ 
              mt: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '& .MuiButton-startIcon': { margin: 0 }
            }}
          >
            טען נתוני דוגמה (בית פרטי + מחסן)
          </Button>

        </Box>
      </Paper>
    </Box>
  );
};