import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Card, Typography, Chip, CircularProgress, Alert, Button, Divider, Avatar
} from '@mui/material';
import { keyframes, styled } from '@mui/system';
import { 
    Visibility as VisibilityIcon,
    PersonOutlined as PersonOutlineIcon,
    BadgeOutlined as BadgeOutlinedIcon,
    CalendarTodayOutlined as CalendarTodayOutlinedIcon
} from '@mui/icons-material';
import { supabase } from '../services/supabaseClient'; 
import type { Case } from '../services/supabaseClient';
import { fetchPendingCases } from '../services/supabaseClient';

const brandRed = '#ff325c';
const brandBlue = '#5e3bff';
const modernFont = '"Rubik", "Heebo", "Assistant", sans-serif'; 

const fadeSlideUp = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const EnterpriseCard = styled(Card)(({ theme }) => ({
    position: 'relative',
    borderRadius: '24px',
    padding: '24px',
    background: '#ffffff',
    border: `1px solid rgba(255, 50, 92, 0.08)`, 
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflow: 'hidden',
    fontFamily: modernFont,
    '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: `0 20px 40px rgba(255, 50, 92, 0.12)`, 
        borderColor: `rgba(255, 50, 92, 0.3)`,
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${brandRed} 0%, #ff7a98 100%)`, 
        opacity: 0.9,
    }
}));

const InfoRow = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#546e7a',
});

export const CasesList: React.FC = () => {
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    const loadCases = async () => {
        try {
            const data = await fetchPendingCases();
            console.log("נתונים שהגיעו מ-Supabase:", data); // בדיקה חשובה בקונסול
            setCases(data || []);
        } catch (err) {
            console.error("שגיאת טעינה:", err);
            setError('אירעה שגיאה בטעינת התיקים.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCases();

        // הגדרה יציבה יותר של ה-Realtime
        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'cases' },
                (payload) => {
                    console.log("שינוי זוהה ב-DB!", payload);
                    loadCases();
                }
            )
            .subscribe((status) => {
                console.log("סטטוס חיבור Realtime:", status);
                if (status === 'CHANNEL_ERROR') {
                    console.warn("Realtime נכשל - עובר למצב רענון ידני");
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const renderRiskBadge = (level?: 'green' | 'yellow' | 'red') => {
        const riskMap = {
            green: { label: 'סיכון נמוך', color: '#2e7d32', bgcolor: 'rgba(46, 125, 50, 0.1)' },
            yellow: { label: 'בדיקה נדרשת', color: '#ed6c02', bgcolor: 'rgba(237, 108, 2, 0.1)' },
            red: { label: 'סיכון גבוה', color: brandRed, bgcolor: `rgba(255, 50, 92, 0.15)` },
        };
        const config = riskMap[level || 'yellow'] || riskMap.yellow;

        return (
            <Chip
                label={config.label}
                size="small"
                sx={{ 
                    fontFamily: modernFont,
                    fontWeight: 800, 
                    borderRadius: '8px', 
                    px: 1.5,
                    py: 1.5, 
                    color: config.color,
                    bgcolor: config.bgcolor,
                    letterSpacing: '0.5px'
                }}
            />
        );
    };

    if (loading && cases.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: brandRed }} size={60} thickness={4} />
            </Box>
        );
    }

    if (error) return (
        <Alert severity="error" sx={{ fontFamily: modernFont, borderRadius: 4, mb: 4, boxShadow: `0 8px 24px rgba(255, 50, 92, 0.15)` }}>
            {error}
            <Button onClick={loadCases} color="inherit" size="small" sx={{ ml: 2 }}>נסה שוב</Button>
        </Alert>
    );

    return (
        <Box sx={{ px: { xs: 2, md: 6 }, py: 6, maxWidth: '1600px', margin: '0 auto', bgcolor: '#fcfcfc', minHeight: '100vh', fontFamily: modernFont }}>
            
            <Box sx={{ mb: 8, textAlign: 'center', position: 'relative' }}>
                <Typography 
                    variant="h1" 
                    sx={{ 
                        fontFamily: modernFont,
                        fontSize: { xs: '3rem', md: '6rem', lg: '8rem' },
                        fontWeight: 900, 
                        letterSpacing: '0.05em',
                        background: `linear-gradient(180deg, rgba(94, 59, 255, 0.35) 0%, rgba(94, 59, 255, 0.02) 100%)`, 
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textTransform: 'uppercase',
                        lineHeight: 1,
                        userSelect: 'none'
                    }}
                >
                    DASHBOARD
                </Typography>
                
                <Box sx={{ transform: 'translateY(-30%)' }}>
                    <Typography variant="h4" sx={{ fontFamily: modernFont, fontWeight: 800, color: '#1a1a1a', mb: 1 }}>
                        מערכת חיתום
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, color: '#78909c' }}>
                        <Typography variant="subtitle1" sx={{ fontFamily: modernFont, fontWeight: 500 }}>
                            זיהוי וניתוח סיכונים אוטומטי
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontFamily: modernFont, color: '#cfd8dc' }}>
                            •
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontFamily: modernFont, fontWeight: 500, direction: 'rtl' }}>
                            {cases.length} תיקים פתוחים
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {cases.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                    <Typography variant="h5" sx={{ fontFamily: modernFont, color: '#90a4ae', fontWeight: 600, mb: 2 }}>
                        אין תיקים הממתינים לטיפול כרגע. עבודה מצוינת!
                    </Typography>
                    <Button variant="outlined" onClick={loadCases} sx={{ color: brandRed, borderColor: brandRed }}>רענן נתונים</Button>
                </Box>
            ) : (
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
                    gap: '32px' 
                }}>
                    {cases.map((caseItem, index) => (
                        <EnterpriseCard 
                            key={caseItem.id} 
                            sx={{ 
                                animation: `${fadeSlideUp} 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                                animationDelay: `${index * 0.08}s`,
                                opacity: 0 
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: `rgba(255, 50, 92, 0.08)`, color: brandRed, width: 48, height: 48 }}>
                                        <PersonOutlineIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography sx={{ fontFamily: modernFont, fontWeight: 800, fontSize: '1.15rem', color: '#101828' }}>
                                          {`${caseItem.customer_payload?.personal_details?.first_name || 'לקוח'} ${caseItem.customer_payload?.personal_details?.last_name || ''}`}
                                        </Typography>
                                        <Typography sx={{ fontFamily: modernFont, fontSize: '0.85rem', color: '#667085', fontWeight: 600 }}>
                                            תיק #{caseItem.id.substring(0, 8)}
                                        </Typography>
                                    </Box>
                                </Box>
                                {renderRiskBadge(caseItem.final_risk_level)}
                            </Box>

                            <Divider sx={{ borderColor: 'rgba(0,0,0,0.04)', my: 1 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                                <InfoRow>
                                    <BadgeOutlinedIcon fontSize="small" sx={{ color: '#98a2b3' }} />
                                    <Typography sx={{ fontFamily: modernFont, fontSize: '0.95rem', fontWeight: 500 }}>
                                        ת"ז: <span style={{ color: '#344054', fontWeight: 700 }}>{caseItem.customer_payload?.personal_details?.id_number || '---'}</span>
                                    </Typography>
                                </InfoRow>
                                
                                <InfoRow>
                                    <CalendarTodayOutlinedIcon fontSize="small" sx={{ color: '#98a2b3' }} />
                                    <Typography sx={{ fontFamily: modernFont, fontSize: '0.95rem', fontWeight: 500 }}>
                                        נפתח ב: <span style={{ color: '#344054', fontWeight: 700 }}>
                                            {caseItem.created_at
                                                ? new Date(caseItem.created_at).toLocaleDateString('he-IL', { hour: '2-digit', minute: '2-digit' })
                                                : '---'}
                                        </span>
                                    </Typography>
                                </InfoRow>
                            </Box>

                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<VisibilityIcon />}
                                sx={{ 
                                    fontFamily: modernFont,
                                    mt: 'auto',
                                    borderRadius: '12px',
                                    py: 1.2,
                                    bgcolor: '#ffffff',
                                    color: brandRed,
                                    border: `1px solid ${brandRed}`,
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    boxShadow: 'none',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: brandRed,
                                        color: '#ffffff',
                                        boxShadow: `0 8px 16px rgba(255, 50, 92, 0.2)`,
                                        border: '1px solid transparent',
                                    }
                                }}
                                onClick={() => navigate(`/case/${caseItem.id}`)}
                            >
                                בדיקת חתם
                            </Button>
                        </EnterpriseCard>
                    ))}
                </Box>
            )}
        </Box>
    );
};