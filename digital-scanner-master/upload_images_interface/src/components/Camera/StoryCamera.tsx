import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Box, Button, Typography, CircularProgress, Paper, Alert } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import { type RoomCategory } from '../../types/types';
import { apiClient } from '../../api/apiClient';
import InfoIcon from '@mui/icons-material/Info';

interface StoryCameraProps {
  caseId: string;
  requiredRooms: RoomCategory[];
  onFinishAllRooms: () => void;
}

const PROJECT_PINK = '#ff325c';

// הוראות צילום בסיסיות
const ROOM_INSTRUCTIONS: Record<string, string> = {
  "סלון": "דאג לצלם את כל חלל הסלון מזווית רחבה. הדלק תאורה כדי שהתמונה תהיה חדה.",
  "מטבח": "צלם את ארונות המטבח, השיש ומוצרי החשמל. ודא שתאורת החדר דולקת.",
  "חדר שינה": "צלם את החדר כך שיראו את המיטות, הארון ומבנה החדר.",
  "דלת כניסה": "צלם את הדלת מבחוץ כך שניתן יהיה לראות את כל אזור הכניסה.",
  "מחסן": "פתח את דלת המחסן וצלם את התכולה שלו באור מלא ככל האפשר.",
  "פרגולה": "צלם את הפרגולה בשלמותה מזווית רחבה, רצוי באור יום.",
  "מרפסת": "צלם את שטח המרפסת, כולל סגירות חורף אם קיימות.",
  "גינה": "צלם את שטח הגינה במלואו, כולל בריכה או ג'קוזי אם קיימים.",
  "צילום הדירה מבחוץ": "עמוד במרחק שיאפשר לראות את כל חזית המבנה.",
  "כניסה לבניין": "צלם את לובי הכניסה, דלתות הבניין ואזור תיבות הדואר."
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const StoryCamera: React.FC<StoryCameraProps> = ({ caseId, requiredRooms, onFinishAllRooms }) => {
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
 
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentRoomName = requiredRooms[currentRoomIndex];
  const progressPercentage = ((currentRoomIndex + 1) / requiredRooms.length) * 100;

  // פונקציה לבחירת הוראה מתאימה (גם לחדרי שינה דינמיים)
  const getInstruction = (roomName: string) => {
    if (roomName.includes("חדר שינה")) return ROOM_INSTRUCTIONS["חדר שינה"];
    return ROOM_INSTRUCTIONS[roomName] || "נא לצלם תמונה ברורה של האזור.";
  };

  const capture = useCallback(() => {
    setErrorMessage(null);
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setErrorMessage(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setErrorMessage(null);
  };

const handleApproveAndUpload = async () => {
    if (!capturedImage) return;
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const imageFile = dataURLtoFile(capturedImage, `room_${currentRoomIndex}.jpg`);
      const response = await apiClient.analyzeImage(caseId, currentRoomName, imageFile);
      
      // --- התיקון החדש כאן: טיפול במקרה של "נסה שוב" מה-AI ---
      if (response.status === 'retry_required') {
        setErrorMessage(response.message); // מציג את ההודעה: "אהלן, נא להעלות תמונה נוספת..."
        setCapturedImage(null); // מחזיר למצב מצוין כדי לצלם שוב
        return; // עוצר כאן ולא עובר לחדר הבא
      }

      if (response.status === 'success') {
        if (currentRoomIndex + 1 < requiredRooms.length) {
          setCurrentRoomIndex((prev) => prev + 1);
          setCapturedImage(null);
        } else {
          onFinishAllRooms();
        }
      } 
    } catch (error: any) {
      // כאן מטופלות שגיאות תקשורת או שגיאות שרת (500)
      const serverError = error.response?.data?.detail;
      
      if (serverError) {
        setErrorMessage(serverError);
      } else {
        setErrorMessage("אופס, משהו השתבש בתקשורת עם השרת.");
      }
      
      setCapturedImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const buttonStyle = {
    borderRadius: 50,
    py: { xs: 1.5, md: 2 },
    px: { xs: 3, md: 5 },
    fontSize: { xs: '1rem', md: '1.2rem' },
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.5,
    width: { xs: '100%', sm: 'auto' },
    textTransform: 'none'
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      
      <Box sx={{
        p: 3,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderBottom: '1px solid #eee'
      }}>
        
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={progressPercentage}
            size={80}
            thickness={4}
            sx={{ color: PROJECT_PINK }}
          />
          <Box
            sx={{
              top: 0, left: 0, bottom: 0, right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" component="div" color="text.primary" sx={{ fontWeight: 'bold' }}>
              {currentRoomIndex + 1}/{requiredRooms.length}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
           {currentRoomName}
        </Typography>
        
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'rgba(255, 50, 92, 0.05)',
          p: 1.5,
          borderRadius: 3,
          maxWidth: '500px'
        }}>
          <InfoIcon sx={{ color: PROJECT_PINK, fontSize: 20 }} />
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 500 }}>
            {getInstruction(currentRoomName)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        
        {errorMessage && (
          <Alert severity="error" sx={{ width: '100%', maxWidth: '700px', mb: 2, borderRadius: 3, fontWeight: 'bold' }}>
            {errorMessage}
          </Alert>
        )}

        {isUploading ? (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: PROJECT_PINK }} size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 3, color: 'text.primary', fontWeight: 'bold' }}>
              ה-AI סורק את ה{currentRoomName}...
            </Typography>
          </Box>
        ) : (
          <Paper elevation={0} sx={{
            overflow: 'hidden',
            borderRadius: 6,
            width: '100%',
            maxWidth: { xs: '100%', sm: '500px', md: '700px' },
            bgcolor: 'black',
            border: `2px solid ${PROJECT_PINK}15`
          }}>
            {!capturedImage ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            ) : (
              <img src={capturedImage} alt="תצוגה מקדימה" style={{ width: '100%', height: 'auto', display: 'block' }} />
            )}
          </Paper>
        )}
      </Box>

      {!isUploading && (
        <Box sx={{
          p: 3,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          borderTop: '1px solid #eee'
        }}>
          
          {!capturedImage ? (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              <Button
                variant="contained"
                onClick={capture}
                sx={{ ...buttonStyle, bgcolor: PROJECT_PINK, '&:hover': { bgcolor: PROJECT_PINK, opacity: 0.9 } }}
                startIcon={<PhotoCameraIcon />}
              >
                צלם תמונה
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                sx={{ ...buttonStyle, color: PROJECT_PINK, borderColor: PROJECT_PINK, '&:hover': { borderColor: PROJECT_PINK, bgcolor: 'rgba(255, 50, 92, 0.04)' } }}
                startIcon={<PhotoLibraryIcon />}
              >
                העלה מהגלריה
              </Button>
              
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: '400px' }}>
              <Button
                variant="contained"
                onClick={handleApproveAndUpload}
                sx={{ ...buttonStyle, bgcolor: PROJECT_PINK, '&:hover': { bgcolor: PROJECT_PINK, opacity: 0.9 } }}
                startIcon={<CheckCircleIcon />}
              >
                נראה מעולה, המשך!
              </Button>
              <Button
                variant="text"
                onClick={retake}
                sx={{ ...buttonStyle, color: 'text.secondary' }}
                startIcon={<ReplayIcon />}
              >
                נסה שוב
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};