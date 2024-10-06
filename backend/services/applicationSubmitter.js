const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const natural = require('natural');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');
const Application = require('../models/Application');

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

const submitApplication = async (jobListing, userProfile) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(jobListing.link, { waitUntil: 'networkidle2', timeout: 60000 });

    const keywordsByImportance = await analyzeJobDescription(jobListing.description);
    const customizedResume = await customizeDocument(userProfile.resume, keywordsByImportance);
    const customizedCoverLetter = await customizeDocument(userProfile.coverLetter, keywordsByImportance);

    await fillApplicationForm(page, userProfile, jobListing);
    await uploadDocuments(page, customizedResume, customizedCoverLetter);
    await submitForm(page);

    await updateApplicationStatus(jobListing._id, userProfile._id, 'submitted');
    logger.info(`Successfully submitted application for job ${jobListing._id}`);
  } catch (error) {
    logger.error(`Error submitting application for job ${jobListing._id}: ${error.message}`);
    await updateApplicationStatus(jobListing._id, userProfile._id, 'failed');
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};

const analyzeJobDescription = async (description) => {
  const tfidf = new TfIdf();
  tfidf.addDocument(description.toLowerCase());
  const tokens = tokenizer.tokenize(description.toLowerCase());
  const uniqueTokens = [...new Set(tokens)];
  return uniqueTokens
    .map(token => [token, tfidf.tfidf(token, 0)])
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
};

const customizeDocument = async (documentPath, keywords) => {
  const document = await fs.readFile(documentPath, 'utf8');
  let customizedDocument = document;
  keywords.slice(0, 10).forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    customizedDocument = customizedDocument.replace(regex, `<strong>${keyword}</strong>`);
  });
  const customizedPath = path.join(path.dirname(documentPath), `customized_${path.basename(documentPath)}`);
  await fs.writeFile(customizedPath, customizedDocument);
  return customizedPath;
};

const fillApplicationForm = async (page, userProfile, jobListing) => {
  const formFieldMappings = {
    '#name': userProfile.name,
    '#email': userProfile.email,
    '#phone': userProfile.phone,
    '#experience': userProfile.yearsOfExperience,
    '#current-company': userProfile.currentCompany,
    '#desired-salary': userProfile.desiredSalary,
    '#position-applied': jobListing.title,
  };
  for (const [selector, value] of Object.entries(formFieldMappings)) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.type(selector, value.toString());
    } catch (error) {
      logger.warn(`Field ${selector} not found on the form. Skipping.`);
    }
  }
};

const uploadDocuments = async (page, resumePath, coverLetterPath) => {
  const uploadSelectors = {
    resume: '#resume-upload',
    coverLetter: '#cover-letter-upload'
  };
  for (const [docType, selector] of Object.entries(uploadSelectors)) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click(selector)
      ]);
      await fileChooser.accept([docType === 'resume' ? resumePath : coverLetterPath]);
    } catch (error) {
      logger.warn(`Failed to upload ${docType}. Selector: ${selector}. Error: ${error.message}`);
    }
  }
};

const submitForm = async (page) => {
  const submitButtonSelector = 'button[type="submit"]';
  await page.waitForSelector(submitButtonSelector);
  await page.click(submitButtonSelector);
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
};

const updateApplicationStatus = async (jobId, userId, status) => {
  await Application.findOneAndUpdate(
    { jobId, userId },
    { status, lastUpdated: new Date() },
    { upsert: true, new: true }
  );
};

module.exports = { submitApplication };