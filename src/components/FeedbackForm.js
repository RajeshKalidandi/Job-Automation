import React, { useState } from 'react';
import { 
  Button, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Rating, Snackbar, Alert, LinearProgress, IconButton, Tooltip 
} from '@mui/material';
import { Feedback as FeedbackIcon, Send as SendIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';

const MAX_COMMENT_LENGTH = 500;

const FeedbackForm = () => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setRating(0);
    setComment('');
    setAttachment(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }
    setLoading(true);
    // Here you would typically send the feedback to your backend
    // For this example, we'll simulate an API call with setTimeout
    setTimeout(() => {
      console.log({ rating, comment, attachment: attachment?.name });
      handleClose();
      setSnackbar({ open: true, message: 'Thank you for your feedback!', severity: 'success' });
      setLoading(false);
    }, 1000);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCommentChange = (e) => {
    if (e.target.value.length <= MAX_COMMENT_LENGTH) {
      setComment(e.target.value);
    }
  };

  const handleAttachment = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      setAttachment(file);
    } else {
      setSnackbar({ open: true, message: 'File size should be less than 5MB', severity: 'error' });
    }
  };

  return (
    <Box sx={{ textAlign: 'center', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        We'd love to hear your feedback!
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        startIcon={<FeedbackIcon />}
      >
        Provide Feedback
      </Button>
      <Dialog open={open} onClose={handleClose} aria-labelledby="feedback-dialog-title">
        <DialogTitle id="feedback-dialog-title">Your Feedback</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Typography component="legend">Rate your experience</Typography>
            <Rating
              name="feedback-rating"
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
                setError('');
              }}
              aria-label="Rating"
            />
            {error && <Typography color="error">{error}</Typography>}
            <TextField
              autoFocus
              margin="dense"
              id="feedback-comment"
              label="Comments (optional)"
              type="text"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={comment}
              onChange={handleCommentChange}
              inputProps={{ maxLength: MAX_COMMENT_LENGTH }}
              helperText={`${comment.length}/${MAX_COMMENT_LENGTH}`}
              aria-label="Comment"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <input
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                id="attachment-button"
                type="file"
                onChange={handleAttachment}
              />
              <label htmlFor="attachment-button">
                <Tooltip title="Attach file (max 5MB)">
                  <IconButton color="primary" aria-label="attach file" component="span">
                    <AttachFileIcon />
                  </IconButton>
                </Tooltip>
              </label>
              {attachment && (
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {attachment.name}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              endIcon={<SendIcon />}
              disabled={loading}
            >
              Send Feedback
            </Button>
          </DialogActions>
          {loading && <LinearProgress />}
        </form>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FeedbackForm;