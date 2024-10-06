import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle,
  Chip, IconButton, Tooltip, Snackbar, CircularProgress, Alert
} from '@mui/material';
import { Delete, NoteAdd, Refresh } from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
const ApplicationTracker = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [note, setNote] = useState('');

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/applications', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setApplications(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch applications. Please try again.');
      setLoading(false);
      showSnackbar('Failed to fetch applications', 'error');
    }
  }, []);
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/applications', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setApplications(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch applications. Please try again.');
      setLoading(false);
      showSnackbar('Failed to fetch applications', 'error');
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await axios.put(`/api/applications/${applicationId}/status`, 
        { status: newStatus },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      fetchApplications();
      showSnackbar('Status updated successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to update application status', 'error');
    }
  };
  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await axios.put(`/api/applications/${applicationId}/status`, 
        { status: newStatus },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      fetchApplications();
      showSnackbar('Status updated successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to update application status', 'error');
    }
  };

  const handleAddNote = (application) => {
    setSelectedApplication(application);
    setOpenDialog(true);
  };
  const handleAddNote = (application) => {
    setSelectedApplication(application);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedApplication(null);
    setNote('');
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedApplication(null);
    setNote('');
  };

  const handleSaveNote = async () => {
    try {
      await axios.post(`/api/applications/${selectedApplication._id}/notes`, 
        { content: note },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      fetchApplications();
      handleCloseDialog();
      showSnackbar('Note added successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to add note', 'error');
    }
  };
  const handleSaveNote = async () => {
    try {
      await axios.post(`/api/applications/${selectedApplication._id}/notes`, 
        { content: note },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      fetchApplications();
      handleCloseDialog();
      showSnackbar('Note added successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to add note', 'error');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Application Tracker</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Job Title</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Applied Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app._id}>
                <TableCell>{app.jobTitle}</TableCell>
                <TableCell>{app.company}</TableCell>
                <TableCell>
                  <Chip label={app.status} color="primary" />
                </TableCell>
                <TableCell>{format(new Date(app.appliedDate), 'PP')}</TableCell>
                <TableCell>
                  <Tooltip title="Update Status">
                    <IconButton onClick={() => handleStatusUpdate(app._id, 'nextStatus')}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add Note">
                    <IconButton onClick={() => handleAddNote(app)}>
                      <NoteAdd />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveNote} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Application Tracker</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Job Title</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Applied Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app._id}>
                <TableCell>{app.jobTitle}</TableCell>
                <TableCell>{app.company}</TableCell>
                <TableCell>
                  <Chip label={app.status} color="primary" />
                </TableCell>
                <TableCell>{format(new Date(app.appliedDate), 'PP')}</TableCell>
                <TableCell>
                  <Tooltip title="Update Status">
                    <IconButton onClick={() => handleStatusUpdate(app._id, 'nextStatus')}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add Note">
                    <IconButton onClick={() => handleAddNote(app)}>
                      <NoteAdd />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveNote} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ApplicationTracker;