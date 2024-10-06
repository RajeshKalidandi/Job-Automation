const puppeteer = require('puppeteer');
const JobListing = require('../models/JobListing');
const JobSource = require('../models/JobSource');
const { logger } = require('../utils/logger'); // Assume we have a logger utility

const enhancedScrapeJobs = async (jobSourceId) => {
  let browser;
  try {
    const jobSource = await JobSource.findById(jobSourceId);
    if (!jobSource) {
      throw new Error('Job source not found');
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(jobSource.url, { waitUntil: 'networkidle2', timeout: 60000 });

    const jobs = await page.evaluate((selectors) => {
      const jobListings = document.querySelectorAll(selectors.jobListing);
      return Array.from(jobListings).map(job => ({
        title: job.querySelector(selectors.title)?.textContent.trim() || '',
        company: job.querySelector(selectors.company)?.textContent.trim() || '',
        location: job.querySelector(selectors.location)?.textContent.trim() || '',
        description: job.querySelector(selectors.description)?.textContent.trim() || '',
        link: job.querySelector(selectors.link)?.href || '',
        salary: job.querySelector(selectors.salary)?.textContent.trim() || '',
        postedDate: job.querySelector(selectors.postedDate)?.textContent.trim() || '',
        requiredSkills: Array.from(job.querySelectorAll(selectors.requiredSkills))
          .map(skill => skill.textContent.trim()),
      }));
    }, jobSource.selectors);

    // Advanced filtering
    const filteredJobs = jobs.filter(job => {
      // Implement your filtering logic here
      // Example: Filter based on required skills, location, etc.
      const hasRequiredSkills = job.requiredSkills.some(skill => 
        ['JavaScript', 'React', 'Node.js'].includes(skill)
      );
      const isValidLocation = ['New York', 'San Francisco', 'Remote'].includes(job.location);
      return hasRequiredSkills && isValidLocation;
    });

    // Save filtered job listings to database
    const savePromises = filteredJobs.map(job => 
      JobListing.findOneAndUpdate(
        { title: job.title, company: job.company, source: jobSource._id },
        { 
          ...job, 
          source: jobSource._id,
          scrapedAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    );

    await Promise.all(savePromises);

    // Update last scraped date
    jobSource.lastScraped = new Date();
    await jobSource.save();

    logger.info(`Successfully scraped ${filteredJobs.length} jobs from ${jobSource.name}`);

    return filteredJobs;
  } catch (error) {
    logger.error(`Error scraping jobs from ${jobSource?.name}: ${error.message}`);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = enhancedScrapeJobs;