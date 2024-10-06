const mongoose = require('mongoose');

const JobListingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  company: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  location: {
    type: String,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  link: {
    type: String,
    required: true,
    unique: true
  },
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobSource',
    required: true
  },
  postedDate: {
    type: Date,
    index: true
  },
  scrapedDate: {
    type: Date,
    default: Date.now
  },
  expirationDate: Date,
  salary: {
    type: {
      amount: {
        min: Number,
        max: Number
      },
      currency: {
        type: String,
        default: 'USD'
      },
      period: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
        default: 'yearly'
      }
    },
    multiple: Boolean // Indicates if multiple salaries are listed (e.g., for different locations)
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'temporary', 'internship', 'other'],
    index: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'senior', 'executive'],
    index: true
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  preferredSkills: [{
    type: String,
    trim: true
  }],
  benefits: [String],
  applicationMethod: {
    type: String,
    enum: ['email', 'website', 'in-person', 'phone', 'other']
  },
  applicationDeadline: Date,
  companyDetails: {
    size: String,
    industry: String,
    website: String
  },
  isRemote: {
    type: Boolean,
    default: false,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'filled', 'expired'],
    default: 'active',
    index: true
  },
  // New fields
  hasApplied: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'en'
  },
  requiredEducation: {
    type: String,
    enum: ['high school', 'associate', 'bachelor', 'master', 'doctorate', 'other']
  },
  numberOfOpenings: {
    type: Number,
    min: 1,
    default: 1
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
JobListingSchema.index({ company: 1, title: 1, location: 1 });

// Virtual for time since posted
JobListingSchema.virtual('daysPosted').get(function() {
  return Math.floor((Date.now() - this.postedDate) / (1000 * 60 * 60 * 24));
});

// Instance method to check if the job is still active
JobListingSchema.methods.isActive = function() {
  return this.status === 'active' && (!this.expirationDate || this.expirationDate > new Date());
};

// Static method to find jobs by skills
JobListingSchema.statics.findBySkills = function(skills) {
  return this.find({ requiredSkills: { $in: skills } });
};

// Pre-save middleware to generate shortDescription
JobListingSchema.pre('save', function(next) {
  if (this.description) {
    this.shortDescription = this.description.substring(0, 197) + '...';
  }
  next();
});

module.exports = mongoose.model('JobListing', JobListingSchema);