import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container, Box, AppBar, Toolbar } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { appTheme } from './theme/theme';
import { CasesList } from './components/CasesList';
import { CaseDetail } from './components/CaseDetail';

// הגדרות RTL 
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline /> 
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', dir: 'rtl', bgcolor: 'background.default' }}>
            
            {/* Header משודרג עם הלוגו */}
            <AppBar 
              position="sticky" 
              color="inherit" 
              elevation={0}
              sx={{ borderBottom: '1px solid rgba(0,0,0,0.06)', backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255,255,255,0.9)' }}
            >
              <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
                {/* צד ימין: הלוגו */}
                <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                  <Box 
                    component="img" 
                    src="/logo.png" 
                    alt="ביטוח ישיר" 
                    sx={{ height: 45, objectFit: 'contain' }} 
                  />
                </Box>
           
              </Toolbar>
            </AppBar>

            {/* תוכן המסכים */}
            <Container maxWidth="xl" sx={{ flexGrow: 1, py: 5 }}>
              <Routes>
                <Route path="/" element={<CasesList />} />
                <Route path="/case/:id" element={<CaseDetail />} />
              </Routes>
            </Container>

          </Box>
        </Router>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;