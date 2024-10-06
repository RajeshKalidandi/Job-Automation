const mongoose = require('mongoose');

const JobSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['job_board', 'company_career_page', 'aggregator', 'social_media', 'other'],
    required: true
  },
  selectors: {
    jobListing: String,
    title: String,
    company: String,
    location: String,
    description: String,
    link: String,
    salary: String,
    postedDate: String,
    requiredSkills: String,
    jobType: String,
    experienceLevel: String,
    benefits: String,
    applicationDeadline: String
  },
  scrapingFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  lastScraped: {
    type: Date,
    default: null
  },
  lastSuccessfulScrape: {
    type: Date,
    default: null
  },
  nextScheduledScrape: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  credentials: {
    username: String,
    password: String,
    apiKey: String
  },
  headers: {
    type: Map,
    of: String
  },
  pagination: {
    type: {
      type: String,
      enum: ['url', 'button', 'infinite_scroll', 'none'],
      default: 'none'
    },
    selector: String,
    maxPages: {
      type: Number,
      default: 1
    }
  },
  filters: [{
    name: String,
    selector: String,
    options: [String]
  }],
  successRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  errorLog: [{
    date: {
      type: Date,
      default: Date.now
    },
    message: String
  }],
  // New fields
  successfulScrapes: {
    type: Number,
    default: 0
  },
  customScrapingLogic: {
    type: String,
    default: null
  },
  proxyConfig: {
    host: String,
    port: Number,
    username: String,
    password: String
  },
  rateLimiting: {
    maxRequests: {
      type: Number,
      default: 60
    },
    perMinutes: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
JobSourceSchema.index({ isActive: 1, nextScheduledScrape: 1 });

// Virtual for time since last scraped
JobSourceSchema.virtual('timeSinceLastScrape').get(function() {
  if (!this.lastScraped) return null;
  return Math.floor((Date.now() - this.lastScraped) / (1000 * 60 * 60)); // in hours
});

// Instance method to update last scraped time
JobSourceSchema.methods.updateLastScraped = function(success = true) {
  this.lastScraped = Date.now();
  if (success) {
    this.lastSuccessfulScrape = Date.now();
    this.successfulScrapes += 1;
  }
  this.calculateNextScrape();
  return this.save();
};

// Instance method to calculate next scrape time
JobSourceSchema.methods.calculateNextScrape = function() {
  const now = new Date();
  switch (this.scrapingFrequency) {
    case 'hourly':
      this.nextScheduledScrape = new Date(now.getTime() + 60 * 60 * 1000);
      break;
    case 'daily':
      this.nextScheduledScrape = new Date(now.setDate(now.getDate() + 1));
      break;
    case 'weekly':
      this.nextScheduledScrape = new Date(now.setDate(now.getDate() + 7));
      break;
    case 'monthly':
      this.nextScheduledScrape = new Date(now.setMonth(now.getMonth() + 1));
      break;
  }
};

// Static method to find active sources due for scraping
JobSourceSchema.statics.findDueForScraping = function() {
  return this.find({
    isActive: true,
    nextScheduledScrape: { $lte: new Date() }
  });
};

module.exports = mongoose.model('JobSource', JobSourceSchema);