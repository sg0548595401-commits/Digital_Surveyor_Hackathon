// src/theme/directTheme.ts
import { createTheme } from '@mui/material/styles';

export const directTheme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#ff325c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#5e3bff',
    },
    text: {
      primary: '#1e285a',
    },
    background: {
      default: '#f4f7f9',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Heebo, sans-serif',
    h6: {
      fontWeight: 700,
      color: '#1e285a',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50, // הנה השינוי - קצוות עגולים לחלוטין (אליפסה)
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 24px', // מרווח פנימי שנותן לכפתור מראה רחב ויציב
        },
      },
    },
  },
});