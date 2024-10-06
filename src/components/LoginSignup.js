import React, { useState } from 'react';
import { 
  Typography, TextField, Button, Box, Tab, Tabs, Paper, InputAdornment, 
  IconButton, Snackbar, Alert, LinearProgress, Link, Checkbox, FormControlLabel 
} from '@mui/material';
import { Visibility, VisibilityOff, Facebook, Google } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const passwordStrength = (password) => {
  const strengthChecks = {
    length: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const strength = Object.values(strengthChecks).filter(Boolean).length;
  return (strength / 5) * 100;
};

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!isLogin && !name) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (isLogin) {
        await login(email, password, rememberMe);
        navigate('/');
      } else {
        await axios.post('/api/auth/signup', { name, email, password });
        setSnackbar({ open: true, message: 'Sign up successful! Please log in.', severity: 'success' });
        setIsLogin(true);
      }
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'An error occurred', 
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSocialLogin = (provider) => {
    // Implement social login logic here
    console.log(`Logging in with ${provider}`);
  };

  const handleForgotPassword = () => {
    // Implement forgot password logic here
    console.log('Forgot password clicked');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
      <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: 400 }}>
        <Tabs value={isLogin ? 0 : 1} onChange={(e, newValue) => setIsLogin(newValue === 0)} centered>
          <Tab label="Login" id="login-tab" aria-controls="login-panel" />
          <Tab label="Sign Up" id="signup-tab" aria-controls="signup-panel" />
        </Tabs>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }} role="tabpanel" id={isLogin ? "login-panel" : "signup-panel"}>
          <Typography variant="h5" align="center" gutterBottom>
            {isLogin ? 'Login' : 'Sign Up'}
          </Typography>
          {!isLogin && (
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              inputProps={{ 'aria-label': 'Name' }}
            />
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus={isLogin}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            inputProps={{ 'aria-label': 'Email Address' }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            inputProps={{ 'aria-label': 'Password' }}
          />
          {!isLogin && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" gutterBottom>
                Password strength:
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={passwordStrength(password)} 
                sx={{ mb: 1 }}
                aria-label="Password strength indicator"
              />
            </Box>
          )}
          {isLogin && (
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />}
              label="Remember me"
            />
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </Button>
          {isLogin && (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Link href="#" onClick={handleForgotPassword} variant="body2">
                Forgot password?
              </Link>
            </Box>
          )}
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Or login with:
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <IconButton onClick={() => handleSocialLogin('facebook')} aria-label="Login with Facebook">
              <Facebook />
            </IconButton>
            <IconButton onClick={() => handleSocialLogin('google')} aria-label="Login with Google">
              <Google />
            </IconButton>
          </Box>
        </Box>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginSignup;