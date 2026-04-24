import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { directTheme } from './theme/directTheme';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={directTheme}>
      <CssBaseline /> 
      <div dir="rtl">
        <App />
      </div>
    </ThemeProvider>
  </React.StrictMode>
);