const express = require('express');
const { search, health } = require('../controllers/searchController');
const { query } = require('express-validator');

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', health);

/**
 * GET /api/search
 * Search for items
 * Query params:
 *   - query: search query (default: "iphone")
 *   - maxResults: max results per source (default: 50, max: 100)
 */
router.get(
  '/search',
  [
    query('query').optional().isString().trim().isLength({ min: 1, max: 100 }),
    query('maxResults').optional().isInt({ min: 1, max: 100 }),
  ],
  search
);

module.exports = router;
