const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Resume files only!');
    }
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.use(limiter);

// Get user profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/', [auth, upload.single('resume'),
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('phone', 'Please enter a valid phone number').isMobilePhone(),
    check('skills', 'Skills must be an array').isArray(),
    check('experience', 'Experience must be an array').isArray(),
    check('education', 'Education must be an array').isArray()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let { name, email, phone, skills, experience, education } = req.body;

    // Sanitize inputs
    name = sanitizeHtml(name);
    email = sanitizeHtml(email);
    phone = sanitizeHtml(phone);
    skills = skills.map(skill => sanitizeHtml(skill));
    experience = experience.map(exp => ({
      ...exp,
      company: sanitizeHtml(exp.company),
      position: sanitizeHtml(exp.position),
      description: sanitizeHtml(exp.description)
    }));
    education = education.map(edu => ({
      ...edu,
      school: sanitizeHtml(edu.school),
      degree: sanitizeHtml(edu.degree),
      fieldOfStudy: sanitizeHtml(edu.fieldOfStudy)
    }));

    const profileFields = { name, email, phone, skills, experience, education };
    if (req.file) {
      profileFields.resume = req.file.path;
    }

    let user = await User.findById(req.user.id);
    if (user) {
      // If user is updating email, check if new email already exists
      if (email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ msg: 'Email already in use' });
        }
      }

      // Delete old resume if new one is uploaded
      if (req.file && user.resume) {
        await fs.unlink(user.resume).catch(err => logger.error('Failed to delete old resume:', err));
      }

      user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: profileFields },
        { new: true, runValidators: true }
      ).select('-password');
    } else {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error(`Error updating user profile: ${error.message}`);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update specific profile fields
router.patch('/', auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'phone', 'skills', 'experience', 'education'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send();
    }

    updates.forEach((update) => user[update] = req.body[update]);
    await user.save();

    res.send(user);
  } catch (error) {
    logger.error(`Error updating specific profile fields: ${error.message}`);
    res.status(400).send(error);
  }
});

// Change password
router.post('/change-password', [auth,
  [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id);
    const { currentPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ msg: 'Password updated successfully' });
  } catch (error) {
    logger.error(`Error changing password: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's resume
router.get('/resume', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.resume) {
      return res.status(404).json({ msg: 'Resume not found' });
    }
    res.sendFile(path.resolve(user.resume));
  } catch (error) {
    logger.error(`Error fetching resume: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user profile
router.delete('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Delete user's resume file if it exists
    if (user.resume) {
      await fs.unlink(user.resume).catch(err => logger.error('Failed to delete resume:', err));
    }

    await User.findByIdAndRemove(req.user.id);
    res.json({ msg: 'User deleted' });
  } catch (error) {
    logger.error(`Error deleting user profile: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;