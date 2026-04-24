import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#e52054', // אדום-מותג
    },
    secondary: {
      main: '#5d3bff', // תכלת-סגול (הצבע המשני שביקשת)
    },
    background: {
      default: '#ffffff', // רקע כללי לבן ונקי
      paper: '#ffffff',   // רקע כרטיסיות לבן
    },
  },
  typography: {
    fontFamily: 'Rubik, Arial, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px' },
    h2: { fontSize: '1.75rem', fontWeight: 700, color: '#1a1a1a' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 24px',
          boxShadow: '0 4px 14px 0 rgba(93, 59, 255, 0.15)', // צל בגוון התכלת
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px 0 rgba(93, 59, 255, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.05)', 
          border: '1px solid rgba(0,0,0,0.04)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        },
      },
    },
  },
});