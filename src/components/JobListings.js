import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Card, CardContent, Button, Grid, TextField, CircularProgress, 
  Pagination, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, Snackbar, Alert, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Work, LocationOn, AttachMoney } from '@mui/icons-material';
import axios from 'axios';
import debounce from 'lodash/debounce';
const JobListings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [filter, setFilter] = useState({ jobType: 'all', location: 'all' });
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/jobs', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          jobType: filter.jobType !== 'all' ? filter.jobType : undefined,
          location: filter.location !== 'all' ? filter.location : undefined
        }
      });
      setJobs(response.data.jobs);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch jobs. Please try again later.');
      setLoading(false);
    }
  }, [page, searchTerm, filter.jobType, filter.location]);
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const debouncedSearch = useCallback(
    debounce(handleSearchChange, 300),
    []
  );

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedJob(null);
  };

  const handleApply = async (jobId) => {
    try {
      await axios.post('/api/applications', { jobId });
      setSnackbar({ open: true, message: 'Application submitted successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to submit application. Please try again.', severity: 'error' });
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <div>
      <Typography variant="h4" gutterBottom>Job Listings</Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search Jobs"
            variant="outlined"
            onChange={debouncedSearch}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Job Type</InputLabel>
            <Select
              value={filter.jobType}
              onChange={(e) => setFilter({ ...filter, jobType: e.target.value })}
              label="Job Type"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="full-time">Full Time</MenuItem>
              <MenuItem value="part-time">Part Time</MenuItem>
              <MenuItem value="contract">Contract</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Location</InputLabel>
            <Select
              value={filter.location}
              onChange={(e) => setFilter({ ...filter, location: e.target.value })}
              label="Location"
            >
              <MenuItem value="all">All Locations</MenuItem>
              <MenuItem value="remote">Remote</MenuItem>
              <MenuItem value="on-site">On-site</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        {jobs.map((job) => (
          <Grid item xs={12} sm={6} md={4} key={job._id}>
            <Card onClick={() => handleJobClick(job)}>
              <CardContent>
                <Typography variant="h6">{job.title}</Typography>
                <Typography color="textSecondary">{job.company}</Typography>
                <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
                  <Work fontSize="small" style={{ marginRight: '5px' }} />
                  <Typography variant="body2">{job.jobType}</Typography>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
                  <LocationOn fontSize="small" style={{ marginRight: '5px' }} />
                  <Typography variant="body2">{job.location}</Typography>
                </div>
                {job.salary && (
                  <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
                    <AttachMoney fontSize="small" style={{ marginRight: '5px' }} />
                    <Typography variant="body2">{job.salary}</Typography>
                  </div>
                )}
                <Typography variant="body2" noWrap>{job.shortDescription}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Pagination
        count={totalPages}
        page={page}
        onChange={(event, value) => setPage(value)}
        sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
      />
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{selectedJob?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="h6">{selectedJob?.company}</Typography>
          <Typography variant="body1" paragraph>{selectedJob?.description}</Typography>
          <Typography variant="subtitle1">Required Skills:</Typography>
          {selectedJob?.requiredSkills.map((skill, index) => (
            <Chip key={index} label={skill} sx={{ m: 0.5 }} />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          <Button onClick={() => handleApply(selectedJob?._id)} color="primary" variant="contained">
            Apply
          </Button>
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
    </div>
  );
};
export default JobListings;
