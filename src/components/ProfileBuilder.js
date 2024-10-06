import React, { useState, useEffect } from 'react';
import { 
  Typography, TextField, Button, Grid, CircularProgress, Paper, 
  Chip, IconButton, Snackbar, Alert, Accordion, AccordionSummary, 
  AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Tooltip
} from '@mui/material';
import { Add as AddIcon, ExpandMore as ExpandMoreIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import axios from 'axios';

const ProfileBuilder = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    skills: [],
    experience: [],
    education: []
  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [newSkill, setNewSkill] = useState('');
  const [openDialog, setOpenDialog] = useState({ open: false, type: '' });
  const [tempItem, setTempItem] = useState({});
  const [confirmDelete, setConfirmDelete] = useState({ open: false, type: '', index: null });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/profile', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setProfile(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch profile. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setFormErrors({ ...formErrors, [e.target.name]: '' });
  };

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const validateForm = () => {
    const errors = {};
    if (!profile.name) errors.name = 'Name is required';
    if (!profile.email) errors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(profile.email)) errors.email = 'Email is invalid';
    if (!profile.phone) errors.phone = 'Phone is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formData = new FormData();
    Object.keys(profile).forEach(key => {
      if (Array.isArray(profile[key])) {
        formData.append(key, JSON.stringify(profile[key]));
      } else {
        formData.append(key, profile[key]);
      }
    });
    if (resume) {
      formData.append('resume', resume);
    }

    try {
      await axios.post('/api/profile', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-auth-token': localStorage.getItem('token')
        },
      });
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update profile. Please try again.', severity: 'error' });
    }
  };

  const handleAddSkill = () => {
    if (newSkill && !profile.skills.includes(newSkill)) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill] });
      setNewSkill('');
    }
  };

  const handleDeleteSkill = (skillToDelete) => {
    setProfile({ ...profile, skills: profile.skills.filter(skill => skill !== skillToDelete) });
  };

  const handleOpenDialog = (type) => {
    setOpenDialog({ open: true, type });
    setTempItem({});
  };

  const handleCloseDialog = () => {
    setOpenDialog({ open: false, type: '' });
    setTempItem({});
  };

  const handleAddItem = () => {
    if (openDialog.type === 'experience') {
      setProfile({ ...profile, experience: [...profile.experience, tempItem] });
    } else if (openDialog.type === 'education') {
      setProfile({ ...profile, education: [...profile.education, tempItem] });
    }
    handleCloseDialog();
  };

  const handleConfirmDelete = (type, index) => {
    setConfirmDelete({ open: true, type, index });
  };

  const handleDeleteItem = () => {
    const { type, index } = confirmDelete;
    if (type === 'experience') {
      setProfile({ ...profile, experience: profile.experience.filter((_, i) => i !== index) });
    } else if (type === 'education') {
      setProfile({ ...profile, education: profile.education.filter((_, i) => i !== index) });
    }
    setConfirmDelete({ open: false, type: '', index: null });
  };

  const calculateProfileCompleteness = () => {
    const fields = ['name', 'email', 'phone', 'skills', 'experience', 'education', 'resume'];
    const completedFields = fields.filter(field => {
      if (Array.isArray(profile[field])) return profile[field].length > 0;
      if (field === 'resume') return resume !== null;
      return profile[field] !== '';
    });
    return (completedFields.length / fields.length) * 100;
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  const completeness = calculateProfileCompleteness();

  return (
    <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
      <form onSubmit={handleSubmit}>
        <Typography variant="h4" gutterBottom>Profile Builder</Typography>
        <LinearProgress variant="determinate" value={completeness} style={{ marginBottom: '20px' }} />
        <Typography variant="body2" gutterBottom>{`Profile Completeness: ${Math.round(completeness)}%`}</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6">Skills</Typography>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={9}>
                <TextField
                  fullWidth
                  label="Add a skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                />
              </Grid>
              <Grid item xs={3}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleAddSkill}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Grid>
            </Grid>
            <div style={{ marginTop: '10px' }}>
              {profile.skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  onDelete={() => handleDeleteSkill(skill)}
                  style={{ margin: '2px' }}
                />
              ))}
            </div>
          </Grid>
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Experience</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {profile.experience.map((exp, index) => (
                  <Paper key={index} elevation={2} style={{ padding: '10px', marginBottom: '10px' }}>
                    <Typography variant="subtitle1">{exp.company} - {exp.position}</Typography>
                    <Typography variant="body2">{exp.startDate} - {exp.endDate}</Typography>
                    <Typography variant="body2">{exp.description}</Typography>
                    <IconButton onClick={() => handleConfirmDelete('experience', index)} aria-label="Delete experience">
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                ))}
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={() => handleOpenDialog('experience')}
                  startIcon={<AddIcon />}
                >
                  Add Experience
                </Button>
              </AccordionDetails>
            </Accordion>
          </Grid>
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Education</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {profile.education.map((edu, index) => (
                  <Paper key={index} elevation={2} style={{ padding: '10px', marginBottom: '10px' }}>
                    <Typography variant="subtitle1">{edu.school} - {edu.degree}</Typography>
                    <Typography variant="body2">{edu.startDate} - {edu.endDate}</Typography>
                    <Typography variant="body2">{edu.fieldOfStudy}</Typography>
                    <IconButton onClick={() => handleConfirmDelete('education', index)} aria-label="Delete education">
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                ))}
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={() => handleOpenDialog('education')}
                  startIcon={<AddIcon />}
                >
                  Add Education
                </Button>
              </AccordionDetails>
            </Accordion>
          </Grid>
          <Grid item xs={12}>
            <input
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              id="resume-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="resume-file">
              <Button variant="contained" component="span">
                Upload Resume
              </Button>
            </label>
            {resume && (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <Typography variant="body2" style={{ marginRight: '10px' }}>{resume.name}</Typography>
                <Tooltip title="Preview Resume">
                  <IconButton onClick={() => window.open(URL.createObjectURL(resume), '_blank')} aria-label="Preview resume">
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
              </div>
            )}
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary">
              Update Profile
            </Button>
          </Grid>
        </Grid>
      </form>
      <Dialog open={openDialog.open} onClose={handleCloseDialog}>
        <DialogTitle>{`Add ${openDialog.type}`}</DialogTitle>
        <DialogContent>
          {openDialog.type === 'experience' && (
            <>
              <TextField fullWidth label="Company" onChange={(e) => setTempItem({...tempItem, company: e.target.value})} />
              <TextField fullWidth label="Position" onChange={(e) => setTempItem({...tempItem, position: e.target.value})} />
              <TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} onChange={(e) => setTempItem({...tempItem, startDate: e.target.value})} />
              <TextField fullWidth label="End Date" type="date" InputLabelProps={{ shrink: true }} onChange={(e) => setTempItem({...tempItem, endDate: e.target.value})} />
              <TextField fullWidth label="Description" multiline rows={4} onChange={(e) => setTempItem({...tempItem, description: e.target.value})} />
            </>
          )}
          {openDialog.type === 'education' && (
            <>
              <TextField fullWidth label="School" onChange={(e) => setTempItem({...tempItem, school: e.target.value})} />
              <TextField fullWidth label="Degree" onChange={(e) => setTempItem({...tempItem, degree: e.target.value})} />
              <TextField fullWidth label="Field of Study" onChange={(e) => setTempItem({...tempItem, fieldOfStudy: e.target.value})} />
              <TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} onChange={(e) => setTempItem({...tempItem, startDate: e.target.value})} />
              <TextField fullWidth label="End Date" type="date" InputLabelProps={{ shrink: true }} onChange={(e) => setTempItem({...tempItem, endDate: e.target.value})} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddItem} color="primary">Add</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, type: '', index: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this {confirmDelete.type} entry?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, type: '', index: null })}>Cancel</Button>
          <Button onClick={handleDeleteItem} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ProfileBuilder;