const express = require('express');
const router = express.Router();
const {
  getFooter,
  updateAboutUs,
  updateCopyright,
  updateCookiePolicy,
  updateKvk,
  addFormSubmission,
  initializeFooter
} = require('../controllers/footerController');

// Initialize footer (should be called only once)
router.post('/initialize', initializeFooter);

// Get all footer data
router.get('/', getFooter);

// Update specific sections
router.put('/about-us', updateAboutUs);
router.put('/copyright', updateCopyright);
router.put('/cookie-policy', updateCookiePolicy);
router.put('/kvk', updateKvk);

// Form submissions
router.post('/form', addFormSubmission);

module.exports = router;
