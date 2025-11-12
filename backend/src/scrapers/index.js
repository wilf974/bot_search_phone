const { scrapeVintedPuppeteer } = require('./vinted-puppeteer');
const logger = require('../utils/logger');

/**
 * Scrape Vinted across all countries using Puppeteer
 * @param {string} query - Search query
 * @param {number} maxResults - Max results total
 * @returns {Promise<Object>} Object with combined results
 */
async function scrapeAll(query = 'iphone', maxResults = 50) {
  logger.info(`Starting Vinted Puppeteer scraping for query: ${query}`);
  const startTime = Date.now();

  try {
    // Scrape Vinted using Puppeteer (more reliable against anti-bot)
    const vinted = await scrapeVintedPuppeteer(query, maxResults);

    const duration = Date.now() - startTime;
    logger.info(
      `Scraping completed in ${duration}ms. Total: ${vinted.length} items from Vinted`
    );

    return {
      total: vinted.length,
      vinted: {
        count: vinted.length,
        success: true,
      },
      results: vinted,
      query,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Scraping error:', error);
    throw error;
  }
}

module.exports = {
  scrapeAll,
};
