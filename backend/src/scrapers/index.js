const { scrapeLeboncoin } = require('./leboncoin');
const { scrapeVinted } = require('./vinted');
const logger = require('../utils/logger');

/**
 * Scrape both Leboncoin and Vinted in parallel
 * @param {string} query - Search query
 * @param {number} maxResults - Max results per source
 * @returns {Promise<Object>} Object with combined results
 */
async function scrapeAll(query = 'iphone', maxResults = 50) {
  logger.info(`Starting scraping for query: ${query}`);
  const startTime = Date.now();

  try {
    // Run scrapers in parallel
    const [leboncoinResults, vintedResults] = await Promise.allSettled([
      scrapeLeboncoin(query, maxResults),
      scrapeVinted(query, maxResults),
    ]);

    // Process results
    const leboncoin = leboncoinResults.status === 'fulfilled'
      ? leboncoinResults.value
      : [];

    const vinted = vintedResults.status === 'fulfilled'
      ? vintedResults.value
      : [];

    // Log any errors
    if (leboncoinResults.status === 'rejected') {
      logger.error('Leboncoin scraping failed:', leboncoinResults.reason);
    }
    if (vintedResults.status === 'rejected') {
      logger.error('Vinted scraping failed:', vintedResults.reason);
    }

    // Combine results
    const allResults = [...leboncoin, ...vinted];

    // Sort by date (newest first) - rough sort
    allResults.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return 0; // Keep original order if dates exist
    });

    const duration = Date.now() - startTime;
    logger.info(
      `Scraping completed in ${duration}ms. Total: ${allResults.length} items ` +
      `(Leboncoin: ${leboncoin.length}, Vinted: ${vinted.length})`
    );

    return {
      total: allResults.length,
      leboncoin: {
        count: leboncoin.length,
        success: leboncoinResults.status === 'fulfilled',
      },
      vinted: {
        count: vinted.length,
        success: vintedResults.status === 'fulfilled',
      },
      results: allResults,
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
  scrapeLeboncoin,
  scrapeVinted,
};
