import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Container, CircularProgress, Box, Snackbar, Alert } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import JobListings from './components/JobListings';
import LoginSignup from './components/LoginSignup';
import ProfileBuilder from './components/ProfileBuilder';
import ApplicationTracker from './components/ApplicationTracker';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Footer from './components/Footer';
import FeedbackForm from './components/FeedbackForm';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
      }),
    [isDarkMode]
  );

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthProvider>
      <SettingsProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
              <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/jobs" element={<JobListings showSnackbar={showSnackbar} />} />
                  <Route path="/login" element={<LoginSignup showSnackbar={showSnackbar} />} />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <ProfileBuilder showSnackbar={showSnackbar} />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/applications"
                    element={
                      <PrivateRoute>
                        <ApplicationTracker showSnackbar={showSnackbar} />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <PrivateRoute>
                        <Settings showSnackbar={showSnackbar} />
                      </PrivateRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Container>
              <FeedbackForm />
              <Footer />
            </Box>
          </Router>
          <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={closeSnackbar}>
            <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </ThemeProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default App;