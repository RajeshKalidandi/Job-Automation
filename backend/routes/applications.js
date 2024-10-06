const express = require('express');
const router = express.Router();
const { submitApplication } = require('../services/applicationSubmitter');
const JobListing = require('../models/JobListing');
const User = require('../models/User');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

// Submit a new application
router.post('/submit', auth, async (req, res) => {
  try {
    const { jobId, source } = req.body;
    const userId = req.user.id;

    const jobListing = await JobListing.findById(jobId);
    const userProfile = await User.findById(userId);

    if (!jobListing || !userProfile) {
      return res.status(404).json({ message: 'Job listing or user profile not found' });
    }

    const application = new Application({
      userId,
      jobId,
      source,
      status: 'applied'
    });

    await submitApplication(jobListing, userProfile);
    await application.save();

    res.json({ message: 'Application submitted successfully', application });
  } catch (error) {
    logger.error(`Error submitting application: ${error.message}`);
    res.status(500).json({ message: 'Error submitting application', error: error.message });
  }
});

// Get all applications for the current user
router.get('/', auth, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id }).populate('jobId');
    res.json(applications);
  } catch (error) {
    logger.error(`Error fetching applications: ${error.message}`);
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

// Get applications by status
router.get('/status/:status', auth, async (req, res) => {
  try {
    const applications = await Application.getByStatus(req.user.id, req.params.status);
    res.json(applications);
  } catch (error) {
    logger.error(`Error fetching applications by status: ${error.message}`);
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

// Update application status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    await application.updateStatus(status);
    res.json(application);
  } catch (error) {
    logger.error(`Error updating application status: ${error.message}`);
    res.status(500).json({ message: 'Error updating application status', error: error.message });
  }
});

// Add note to application
router.post('/:id/notes', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const application = await Application.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.notes.push({ content });
    await application.save();
    res.json(application);
  } catch (error) {
    logger.error(`Error adding note to application: ${error.message}`);
    res.status(500).json({ message: 'Error adding note to application', error: error.message });
  }
});

// Update salary information
router.put('/:id/salary', auth, async (req, res) => {
  try {
    const { offered, negotiated, currency } = req.body;
    const application = await Application.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.salary = { offered, negotiated, currency };
    await application.save();
    res.json(application);
  } catch (error) {
    logger.error(`Error updating salary information: ${error.message}`);
    res.status(500).json({ message: 'Error updating salary information', error: error.message });
  }
});

module.exports = router;