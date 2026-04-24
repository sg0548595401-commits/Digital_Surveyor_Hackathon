import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Card, CardContent, Typography, Button, CircularProgress, Alert, Divider, Chip, Stack, Avatar
} from '@mui/material';
import { Grid } from '@mui/material';
import { keyframes, styled } from '@mui/system';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

// ייבוא פונקציית העדכון ושילוב קומפוננטת התמונות
import type { Case } from '../services/supabaseClient';
import { fetchCaseById, updateCaseStatus } from '../services/supabaseClient';
import { ImageAnalysisViewer } from './ImageAnalysisViewer'; 

const brandRed = '#ff325c';
const brandBlue = '#5e3bff';
const modernFont = '"Rubik", "Heebo", "Assistant", sans-serif';

// --- אנימציות ---
const fadeSlideUp = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

// --- רכיבים מעוצבים ---
const DetailCard = styled(Card)<{ $isdanger?: boolean }>(({ theme, $isdanger }) => ({
    position: 'relative',
    borderRadius: '24px',
    padding: '16px',
    background: '#ffffff',
    border: $isdanger ? `2px solid rgba(255, 50, 92, 0.3)` : `1px solid rgba(0, 0, 0, 0.04)`,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    fontFamily: modernFont,
    overflow: 'visible',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: $isdanger ? `0 20px 40px rgba(255, 50, 92, 0.12)` : '0 20px 40px rgba(0, 0, 0, 0.08)',
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: $isdanger ? `linear-gradient(90deg, ${brandRed} 0%, #ff7a98 100%)` : `linear-gradient(90deg, #cfd8dc 0%, #eceff1 100%)`,
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        opacity: 0.9,
    }
}));

const ActionPanel = styled(Card)({
    borderRadius: '24px',
    padding: '12px 24px',
    background: '#ffffff',
    border: `1px solid rgba(0, 0, 0, 0.05)`,
    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.05)',
    position: 'sticky',
    bottom: '24px',
    zIndex: 10,
    fontFamily: modernFont,
});

const InfoLabel = styled(Typography)({
    fontSize: '0.9rem',
    color: '#78909c',
    fontWeight: 500,
    marginBottom: '4px',
    fontFamily: modernFont,
});

const InfoValue = styled(Typography)({
    fontSize: '1.05rem',
    color: '#1a1a1a',
    fontWeight: 600,
    fontFamily: modernFont,
});

export const CaseDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [caseData, setCaseData] = useState<Case | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    useEffect(() => {
        const loadCase = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await fetchCaseById(id);
                setCaseData(data);
            } catch (err) {
                setError('שגיאה בטעינת פרטי התיק.');
            } finally {
                setLoading(false);
            }
        };
        loadCase();
    }, [id]);

    const handleDecision = async (decision: 'approved' | 'rejected' | 'investigation_needed') => {
        if (!id) return;
        try {
            setIsUpdating(true);
            await updateCaseStatus(id, decision);
            navigate('/');
        } catch (err) {
            alert('אירעה שגיאה בעדכון התיק. נסה שוב.');
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress sx={{ color: brandRed }} size={60} thickness={4} />
            </Box>
        );
    }

    if (error || !caseData) {
        return (
            <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 10, fontFamily: modernFont }}>
                <Alert severity="error" sx={{ borderRadius: 4, boxShadow: '0 8px 24px rgba(211, 47, 47, 0.15)' }}>
                    {error || 'התיק לא נמצא'}
                </Alert>
            </Box>
        );
    }

    const { customer_payload, final_risk_level, has_coverage_gap, underwriter_summary } = caseData;
    const isHighRisk = final_risk_level === 'red';

    return (
        <Box sx={{ px: { xs: 2, md: 6 }, py: 4, maxWidth: '1400px', margin: '0 auto', fontFamily: modernFont }}>
            {/* Header */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' }, 
                justifyContent: 'space-between',
                mb: 6,
                gap: 3,
                animation: `${fadeSlideUp} 0.5s ease-out`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="text"
                        startIcon={<ArrowForwardIcon />}
                        onClick={() => navigate('/')}
                        sx={{ 
                            color: '#78909c', 
                            fontFamily: modernFont, 
                            fontWeight: 600,
                            borderRadius: '12px',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: '#1a1a1a' }
                        }}
                    >
                        חזור
                    </Button>
                    <Box>
                        <Typography variant="h3" sx={{ fontFamily: modernFont, fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.5px' }}>
                            {customer_payload.personal_details?.first_name || ''} {customer_payload.personal_details?.last_name || ''}
                        </Typography>
                        <Typography sx={{ fontFamily: modernFont, color: '#90a4ae', fontWeight: 500 }}>
                            תיק חיתום #{id?.substring(0, 8)}
                        </Typography>
                    </Box>
                </Box>
                
                <Chip
                    label={isHighRisk ? 'סיכון גבוה' : 'בדיקה נדרשת'}
                    sx={{ 
                        fontFamily: modernFont,
                        fontWeight: 800, 
                        fontSize: '1rem', 
                        py: 2.5, px: 1.5,
                        borderRadius: '12px',
                        bgcolor: isHighRisk ? `rgba(255, 50, 92, 0.15)` : 'rgba(237, 108, 2, 0.1)',
                        color: isHighRisk ? brandRed : '#ed6c02',
                        border: `1px solid ${isHighRisk ? 'rgba(255, 50, 92, 0.3)' : 'rgba(237, 108, 2, 0.3)'}`
                    }}
                />
            </Box>

            <Grid container spacing={4} sx={{ mb: 6 }}>
                {/* צד ימין: הצהרת הלקוח */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ animation: `${fadeSlideUp} 0.6s 0.1s both` }}>
                    <DetailCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Avatar sx={{ bgcolor: 'rgba(94, 59, 255, 0.1)', color: brandBlue }}>
                                    <DescriptionOutlinedIcon />
                                </Avatar>
                                <Typography variant="h5" sx={{ fontFamily: modernFont, fontWeight: 800, color: '#1a1a1a' }}>
                                    הצהרת הלקוח
                                </Typography>
                            </Box>
                            
                            <Divider sx={{ mb: 3, borderColor: 'rgba(0,0,0,0.06)' }} />

                            <Stack spacing={3}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <Box>
                                        <InfoLabel>סוג נכס</InfoLabel>
                                        <InfoValue>{customer_payload.property_description?.property_type || '---'}</InfoValue>
                                    </Box>
                                    <Box>
                                        <InfoLabel>מפרט הנכס</InfoLabel>
                                        <InfoValue>
                                            {customer_payload.property_description?.property_specs?.number_of_rooms || 0} חדרים, {customer_payload.property_description?.property_specs?.square_meters || 0} מ"ר
                                        </InfoValue>
                                    </Box>
                                </Box>
                                
                                <Box>
                                    <InfoLabel>היסטוריית תביעות (3 שנים)</InfoLabel>
                                    <InfoValue>{customer_payload.claims_and_refusals?.claims_last_3_years?.had_damages || '---'}</InfoValue>
                                </Box>

                                <Box>
                                    <InfoLabel>תוספות שהוצהרו</InfoLabel>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                        {customer_payload.property_description?.property_additions?.length > 0 ? (
                                            customer_payload.property_description.property_additions.map((addition, index) => (
                                                <Chip 
                                                    key={index} 
                                                    label={addition} 
                                                    sx={{ 
                                                        fontFamily: modernFont, 
                                                        fontWeight: 600,
                                                        borderRadius: '8px',
                                                        bgcolor: '#f4f6f8',
                                                        color: '#454f5b'
                                                    }} 
                                                />
                                            ))
                                        ) : (
                                            <Typography variant="body2" sx={{ fontFamily: modernFont, color: '#90a4ae' }}>לא דווחו תוספות</Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Stack>
                        </CardContent>
                    </DetailCard>
                </Grid>

                {/* צד שמאל: סיכום AI */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ animation: `${fadeSlideUp} 0.6s 0.2s both` }}>
                    <DetailCard $isdanger={isHighRisk}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Avatar sx={{ bgcolor: isHighRisk ? `rgba(255, 50, 92, 0.1)` : 'rgba(94, 59, 255, 0.1)', color: isHighRisk ? brandRed : brandBlue }}>
                                    <SmartToyOutlinedIcon />
                                </Avatar>
                                <Typography variant="h5" sx={{ fontFamily: modernFont, fontWeight: 800, color: '#1a1a1a' }}>
                                    סיכום חיתום AI
                                </Typography>
                            </Box>

                            <Divider sx={{ mb: 3, borderColor: 'rgba(0,0,0,0.06)' }} />

                            <Stack spacing={3} sx={{ height: '100%', justifyContent: 'space-between' }}>
                                <Box>
                                    <InfoLabel>מסקנת מערכת</InfoLabel>
                                    <Typography variant="body1" sx={{ fontFamily: modernFont, fontWeight: 500, color: '#333', lineHeight: 1.6, fontSize: '1.1rem' }}>
                                        {underwriter_summary || 'טרם התקבל סיכום AI'}
                                    </Typography>
                                </Box>

                                {has_coverage_gap && (
                                    <Alert 
                                        severity="warning" 
                                        sx={{ 
                                            fontFamily: modernFont, 
                                            fontWeight: 700, 
                                            borderRadius: '12px',
                                            bgcolor: 'rgba(237, 108, 2, 0.08)',
                                            color: '#cc5c00',
                                            border: '1px solid rgba(237, 108, 2, 0.2)'
                                        }}
                                    >
                                        זוהה פער פוטנציאלי בין ההצהרה לממצאים הוויזואליים!
                                    </Alert>
                                )}
                            </Stack>
                        </CardContent>
                    </DetailCard>
                </Grid>

                {/* אזור גלריית התמונות והעוגנים הוויזואליים */}
                <Grid size={{ xs: 12 }} sx={{ animation: `${fadeSlideUp} 0.6s 0.3s both` }}>
                    <Box sx={{ 
                        width: '100%', 
                        maxWidth: '100%',
                        overflowX: 'hidden', 
                        
                        // פתרון להתרחבות מסגרות מעוגלות (כמו רכיבי Chip) לפי כמות הטקסט
                        '& .MuiChip-root': {
                            height: 'auto !important', // מבטל את הגובה הקשיח של ה-Chip
                            minHeight: '32px',
                            padding: '8px 4px', // הוספת ריווח אנכי פנימי
                            borderRadius: '16px'
                        },
                        
                        // הגדרת הטקסט שבתוך המסגרות שיישבר ויתפוס רוחב מלא
                        '& .MuiChip-label': {
                            display: 'block !important', // חובה כדי להתפרש על שורות
                            whiteSpace: 'normal !important', 
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            lineHeight: 1.5
                        },

                        // ליתר ביטחון עבור אלמנטים נוספים
                        '& .MuiTypography-root, & p, & span': {
                            whiteSpace: 'normal !important', 
                            wordBreak: 'break-word',
                            maxWidth: '100%'
                        },

                        px: { xs: 0, sm: 1 } 
                    }}>
                        <ImageAnalysisViewer caseId={id!} />
                    </Box>
                </Grid>
            </Grid>

            {/* פאנל פעולות (Action Bar) */}
            <ActionPanel sx={{ animation: `${fadeSlideUp} 0.6s 0.4s both` }}>
                <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', p: '16px !important', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontFamily: modernFont, fontWeight: 800, color: '#1a1a1a' }}>
                        החלטת חתם סופית
                    </Typography>
                    
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        <Button
                            variant="outlined"
                            startIcon={<SearchIcon />}
                            onClick={() => handleDecision('investigation_needed')}
                            disabled={isUpdating}
                            sx={{ 
                                fontFamily: modernFont, fontWeight: 700, borderRadius: '12px', px: 3, py: 1.2,
                                color: '#ed6c02', borderColor: '#ed6c02',
                                '&:hover': { bgcolor: 'rgba(237, 108, 2, 0.08)', borderColor: '#ed6c02' }
                            }}
                        >
                            שלח לבדיקת חוקר
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<CancelIcon />}
                            onClick={() => handleDecision('rejected')}
                            disabled={isUpdating}
                            sx={{ 
                                fontFamily: modernFont, fontWeight: 700, borderRadius: '12px', px: 3, py: 1.2,
                                bgcolor: '#ffffff', color: brandRed, border: `1px solid ${brandRed}`, boxShadow: 'none',
                                '&:hover': { bgcolor: brandRed, color: '#ffffff', boxShadow: `0 8px 16px rgba(255, 50, 92, 0.2)` }
                            }}
                        >
                            דחה פוליסה
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={isUpdating ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                            onClick={() => handleDecision('approved')}
                            disabled={isUpdating}
                            sx={{ 
                                fontFamily: modernFont, fontWeight: 700, borderRadius: '12px', px: 4, py: 1.2,
                                bgcolor: '#00c853', boxShadow: '0 8px 20px rgba(0, 200, 83, 0.25)',
                                '&:hover': { bgcolor: '#00e676', boxShadow: '0 8px 25px rgba(0, 200, 83, 0.4)' }
                            }}
                        >
                            אשר פוליסה
                        </Button>
                    </Stack>
                </CardContent>
            </ActionPanel>
        </Box>
    );
};