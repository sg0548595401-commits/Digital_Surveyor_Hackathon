// src/App.tsx
import { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import { SetupPage } from './pages/SetupPage';
import { StoryCamera } from './components/Camera/StoryCamera';
import {type RoomCategory } from './types/types';
import { apiClient } from './api/apiClient';

type AppState = 'setup' | 'camera' | 'ready_to_submit' | 'submitting' | 'success';

function App() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomCategory[]>([]);
  const [appState, setAppState] = useState<AppState>('setup');

  const handleSetupComplete = (id: string, requiredRooms: RoomCategory[]) => {
    setCaseId(id);
    setRooms(requiredRooms);
    setAppState('camera');
  };

  const handleFinishAllRooms = () => {
    setAppState('ready_to_submit');
  };

  const handleFinalSubmit = async () => {
    if (!caseId) return;
    
    setAppState('submitting');
    
    try {
      
      await apiClient.finalizeCase(caseId);
      
      setAppState('success');
    } catch (error) {
      console.error("Error finalizing case", error);
      alert("אירעה שגיאה בשליחת התיק. אנא נסה שוב.");
      setAppState('ready_to_submit'); 
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {appState === 'setup' && (
        <SetupPage onSetupComplete={handleSetupComplete} />
      )}

      {appState === 'camera' && caseId && (
        <StoryCamera 
          caseId={caseId} 
          requiredRooms={rooms} 
          onFinishAllRooms={handleFinishAllRooms} 
        />
      )}

      {(appState === 'ready_to_submit' || appState === 'submitting' || appState === 'success') && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2 }}>
          <Paper elevation={4} sx={{ p: 5, maxWidth: 450, width: '100%', textAlign: 'center', borderRadius: 4 }}>
            
            {appState === 'ready_to_submit' && (
              <>
                <Typography variant="h5" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                  סיימנו לצלם!
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, fontSize: '1.1rem' }}>
                  כל התמונות הועלו בהצלחה. לחץ על הכפתור למטה כדי להגיש את התיק לחברת הביטוח ולסיים את התהליך.
                </Typography>
               <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  endIcon={<SendIcon />}
                  onClick={handleFinalSubmit}
                  fullWidth
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5, 
                    '& .MuiButton-endIcon': { margin: 0 }
                  }}
                >
                  סיים והגש תיק
                </Button>
              </>
            )}

            {appState === 'submitting' && (
              <>
                <CircularProgress color="primary" size={60} thickness={4} />
                <Typography variant="h6" sx={{ mt: 3, color: 'text.primary', fontWeight: 'bold' }}>
                  מגיש את התיק...
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  פעולה זו עשויה לקחת מספר שניות.
                </Typography>
              </>
            )}

            {appState === 'success' && (
              <>
                <CheckCircleIcon sx={{ fontSize: 80, color: '#28a745', mb: 2 }} />
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
                  התיק הוגש בהצלחה!
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
                  תודה רבה. הנתונים הועברו לצוות החיתום שלנו להמשך טיפול. אפשר לסגור את החלון.
                </Typography>
              </>
            )}

          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default App;