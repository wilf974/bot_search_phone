const { scrapeAll } = require('../scrapers');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

/**
 * Search for items across all platforms
 */
async function search(req, res) {
  try {
    const { query = 'iphone', maxResults = 50 } = req.query;

    logger.info(`Search request received: query="${query}", maxResults=${maxResults}`);

    // Validate query
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
      });
    }

    // Validate maxResults
    const max = parseInt(maxResults);
    if (isNaN(max) || max < 1 || max > 100) {
      return res.status(400).json({
        success: false,
        error: 'maxResults must be between 1 and 100',
      });
    }

    // Create cache key
    const cacheKey = `search:${query.toLowerCase()}:${max}`;

    // Check cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for: ${cacheKey}`);
      return res.json({
        success: true,
        cached: true,
        ...cachedData,
      });
    }

    // Scrape data
    logger.info(`Cache miss, scraping for: ${query}`);
    const data = await scrapeAll(query, max);

    // Cache results
    await cache.set(cacheKey, data);

    // Return results
    return res.json({
      success: true,
      cached: false,
      ...data,
    });
  } catch (error) {
    logger.error('Search controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during search',
      message: error.message,
    });
  }
}

/**
 * Health check endpoint
 */
async function health(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

module.exports = {
  search,
  health,
};
