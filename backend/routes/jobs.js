const express = require('express');
const router = express.Router();
const JobListing = require('../models/JobListing');
const JobSource = require('../models/JobSource');
const { enhancedScrapeJobs } = require('../services/scraper');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

// Get paginated job listings with filtering and sorting
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    if (page < 1 || limit < 1) {
      return res.status(400).json({ message: 'Invalid pagination parameters' });
    }

    let query = {};
    if (req.query.company) query.company = new RegExp(req.query.company, 'i');
    if (req.query.title) query.title = new RegExp(req.query.title, 'i');
    if (req.query.location) query.location = new RegExp(req.query.location, 'i');
    if (req.query.jobType) query.jobType = req.query.jobType;
    if (req.query.isRemote) query.isRemote = req.query.isRemote === 'true';

    const sortField = req.query.sortBy || 'scrapedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const total = await JobListing.countDocuments(query);
    const jobs = await JobListing.find(query)
      .limit(limit)
      .skip(startIndex)
      .sort({ [sortField]: sortOrder });

    res.json({
      jobs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalJobs: total
    });
  } catch (err) {
    logger.error(`Error fetching job listings: ${err.message}`);
    res.status(500).json({ message: 'Error fetching job listings' });
  }
});

// Get a single job listing by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job listing not found' });
    }
    res.json(job);
  } catch (err) {
    logger.error(`Error fetching job listing: ${err.message}`);
    res.status(500).json({ message: 'Error fetching job listing' });
  }
});

// Update a job listing
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedJob = await JobListing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedJob) {
      return res.status(404).json({ message: 'Job listing not found' });
    }
    res.json(updatedJob);
  } catch (err) {
    logger.error(`Error updating job listing: ${err.message}`);
    res.status(500).json({ message: 'Error updating job listing' });
  }
});

// Delete a job listing
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedJob = await JobListing.findByIdAndDelete(req.params.id);
    if (!deletedJob) {
      return res.status(404).json({ message: 'Job listing not found' });
    }
    res.json({ message: 'Job listing deleted successfully' });
  } catch (err) {
    logger.error(`Error deleting job listing: ${err.message}`);
    res.status(500).json({ message: 'Error deleting job listing' });
  }
});

// Trigger job scraping for all sources
router.post('/scrape', auth, async (req, res) => {
  try {
    const jobSources = await JobSource.find();
    const scrapePromises = jobSources.map(source => enhancedScrapeJobs(source._id));
    const results = await Promise.all(scrapePromises);
    const totalJobsScraped = results.reduce((sum, jobs) => sum + jobs.length, 0);
    res.json({ message: 'Job scraping completed successfully', jobsScraped: totalJobsScraped });
  } catch (error) {
    logger.error(`Error in job scraping: ${error.message}`);
    res.status(500).json({ message: 'Error scraping jobs', error: error.message });
  }
});

module.exports = router;