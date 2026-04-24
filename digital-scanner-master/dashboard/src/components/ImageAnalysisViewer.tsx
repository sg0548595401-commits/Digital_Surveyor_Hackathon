import React, { useEffect, useState } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Card, CardContent, CardMedia,
    Chip, List, ListItem, ListItemIcon, ListItemText, Divider, Button, Avatar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InsertPhotoOutlinedIcon from '@mui/icons-material/InsertPhotoOutlined';
import type { ImageAnalysis } from '../services/supabaseClient';
import { fetchImageAnalyses } from '../services/supabaseClient';

const brandRed = '#ff325c';
const brandBlue = '#5e3bff';
const modernFont = '"Rubik", "Heebo", "Assistant", sans-serif';

interface Props {
    caseId: string;
}

export const ImageAnalysisViewer: React.FC<Props> = ({ caseId }) => {
    const [images, setImages] = useState<ImageAnalysis[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadImages = async () => {
            try {
                setLoading(true);
                const data = await fetchImageAnalyses(caseId);
                setImages(data);
            } catch (err) {
                setError('שגיאה בטעינת ניתוח התמונות.');
            } finally {
                setLoading(false);
            }
        };
        loadImages();
    }, [caseId]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: brandBlue }} />
            </Box>
        );
    }

    if (error) return (
        <Alert severity="error" sx={{ borderRadius: '16px', fontFamily: modernFont }}>
            {error}
        </Alert>
    );

    if (images.length === 0) {
        return (
            <Card sx={{
                bgcolor: 'rgba(0,0,0,0.02)',
                border: '2px dashed rgba(0,0,0,0.1)',
                borderRadius: '24px',
                boxShadow: 'none'
            }}>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                    <InsertPhotoOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ fontFamily: modernFont, fontWeight: 500 }}>
                        טרם נותחו תמונות עבור תיק זה.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{
                fontFamily: modernFont,
                fontWeight: 800,
                color: '#1a1a1a',
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
            }}>
                <InsertPhotoOutlinedIcon sx={{ color: brandBlue }} />
                ניתוח חדרים וממצאים חזותיים
            </Typography>

            <Grid container spacing={3}>
                {images.map((img) => {
                    const ai = img.ai_analysis_result;
                    const isRed = ai.traffic_light_status === 'red';

                    return (
                        <Grid size={{ xs: 12 }} key={img.id}>
                            <Card sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                borderRadius: '24px',
                                border: isRed ? `2px solid ${brandRed}` : '1px solid rgba(0,0,0,0.05)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                                overflow: 'hidden',
                                background: '#ffffff',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-2px)' }
                            }}>
                               
                                {/* תצוגה מקדימה של התמונה (Thumbnail) */}
                                <Box sx={{ position: 'relative', width: { xs: '100%', md: 280 }, minWidth: { md: 280 } }}>
                                    <CardMedia
                                        component="img"
                                        image={img.image_url}
                                        alt={img.category}
                                        sx={{
                                            height: { xs: 200, md: '100%' },
                                            width: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <Button
                                        href={img.image_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            position: 'absolute',
                                            bottom: 12,
                                            right: 12,
                                            minWidth: 'auto',
                                            bgcolor: 'rgba(255,255,255,0.9)',
                                            color: '#1a1a1a',
                                            p: 1,
                                            borderRadius: '10px',
                                            backdropFilter: 'blur(4px)',
                                            '&:hover': { bgcolor: '#ffffff' }
                                        }}
                                    >
                                        <OpenInNewIcon fontSize="small" />
                                    </Button>
                                </Box>

                                <CardContent sx={{ p: 4, flexGrow: 1 }}>
                                    {/* Header: שם קטגוריה וסטטוס */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 2 }}>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontFamily: modernFont, fontWeight: 800, color: '#1a1a1a', mb: 0.5 }}>
                                                {img.category}
                                            </Typography>
                                            <Chip
                                                label={ai.traffic_light_status === 'green' ? 'תקין' : isRed ? 'סיכון גבוה' : 'בדיקה נדרשת'}
                                                size="small"
                                                sx={{
                                                    fontFamily: modernFont,
                                                    fontWeight: 800,
                                                    borderRadius: '6px',
                                                    bgcolor: isRed ? 'rgba(255, 50, 92, 0.15)' : ai.traffic_light_status === 'green' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(237, 108, 2, 0.1)',
                                                    color: isRed ? brandRed : ai.traffic_light_status === 'green' ? '#2e7d32' : '#ed6c02',
                                                }}
                                            />
                                        </Box>
                                       
                                        <Button
                                            variant="text"
                                            endIcon={<OpenInNewIcon />}
                                            href={img.image_url}
                                            target="_blank"
                                            sx={{ fontFamily: modernFont, fontWeight: 700, color: brandBlue }}
                                        >
                                            מקור
                                        </Button>
                                    </Box>

                                    <Typography variant="body2" sx={{ fontFamily: modernFont, color: '#454f5b', mb: 3, lineHeight: 1.6 }}>
                                        {ai.summary}
                                    </Typography>

                                    <Divider sx={{ mb: 3, opacity: 0.6 }} />

                                    <Grid container spacing={2}>
                                        {/* פערים */}
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="subtitle2" sx={{ fontFamily: modernFont, fontWeight: 800, color: brandRed, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <WarningAmberIcon sx={{ fontSize: '1.1rem' }} /> פערים:
                                            </Typography>
                                            <Box sx={{ pl: 1 }}>
                                                {ai.property_gaps && ai.property_gaps.length > 0 ? (
                                                    ai.property_gaps.map((gap, i) => (
                                                        <Typography key={i} sx={{ fontFamily: modernFont, fontSize: '0.85rem', color: '#333', mb: 0.5, display: 'list-item', listStyleType: 'disc', listStylePosition: 'inside' }}>
                                                            {gap.gap_description}
                                                        </Typography>
                                                    ))
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">לא נמצאו פערים</Typography>
                                                )}
                                            </Box>
                                        </Grid>

                                        {/* עוגנים */}
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="subtitle2" sx={{ fontFamily: modernFont, fontWeight: 800, color: brandBlue, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <CenterFocusStrongIcon sx={{ fontSize: '1.1rem' }} /> עוגנים:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {ai.visual_anchors && ai.visual_anchors.map((anchor, i) => (
                                                    <Chip
                                                        key={i}
                                                        label={anchor.description}
                                                        size="small"
                                                        sx={{
                                                            fontFamily: modernFont,
                                                            fontSize: '0.75rem',
                                                            height: 'auto',
                                                            py: 0.5,
                                                            bgcolor: '#f4f6f8',
                                                            '& .MuiChip-label': { whiteSpace: 'normal' }
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};
