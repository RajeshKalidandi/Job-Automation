const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobListing',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['applied', 'screening', 'interviewing', 'offered', 'rejected', 'accepted', 'withdrawn'],
    default: 'applied'
  },
  appliedDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  interviewDates: [{
    type: Date
  }],
  lastFollowUp: {
    type: Date
  },
  nextFollowUp: {
    type: Date
  },
  notes: [{
    content: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  resumeVersion: {
    type: String
  },
  coverLetterVersion: {
    type: String
  },
  salary: {
    offered: Number,
    negotiated: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  feedback: String,
  source: {
    type: String,
    enum: ['company_website', 'job_board', 'referral', 'recruiter', 'other'],
    required: true
  },
  contactPerson: {
    name: String,
    email: String,
    phone: String,
    position: String
  },
  customFields: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ appliedDate: -1 });

// Virtual for time since application
ApplicationSchema.virtual('timeSinceApplied').get(function() {
  return (Date.now() - this.appliedDate) / (1000 * 60 * 60 * 24); // in days
});

// Instance method to update status
ApplicationSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  this.lastUpdated = Date.now();
  return this.save();
};

// Static method to get applications by status
ApplicationSchema.statics.getByStatus = function(userId, status) {
  return this.find({ userId, status }).populate('jobId');
};

// Middleware to update lastUpdated on save
ApplicationSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Application', ApplicationSchema);