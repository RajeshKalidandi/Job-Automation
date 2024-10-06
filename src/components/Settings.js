import React from 'react';
import { Typography, Paper, Switch, FormControlLabel, Box } from '@mui/material';
import { useSettings } from '../context/SettingsContext';

const Settings = () => {
  const { settings, updateSettings } = useSettings();

  const handleChange = (event) => {
    updateSettings({ [event.target.name]: event.target.checked });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Paper sx={{ p: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.notifications}
              onChange={handleChange}
              name="notifications"
            />
          }
          label="Enable Notifications"
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.emailAlerts}
              onChange={handleChange}
              name="emailAlerts"
            />
          }
          label="Enable Email Alerts"
        />
        {/* Add more settings as needed */}
      </Paper>
    </Box>
  );
};

export default Settings;