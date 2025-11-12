const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Scrape Vinted for iPhone listings using their API
 * @param {string} query - Search query (default: "iphone")
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} Array of listings
 */
async function scrapeVinted(query = 'iphone', maxResults = 50) {
  const startTime = Date.now();
  logger.info(`Starting Vinted scraping for: ${query}`);

  try {
    // Vinted API endpoint (France)
    const baseUrl = 'https://www.vinted.fr/api/v2/catalog/items';

    // Build query parameters
    const params = {
      search_text: query,
      catalog_ids: '',
      order: 'newest_first',
      page: 1,
      per_page: Math.min(maxResults, 96), // Max 96 per page
    };

    // Random user agent
    const userAgent = config.scraper.userAgents[
      Math.floor(Math.random() * config.scraper.userAgents.length)
    ];

    // Make request with more headers to avoid 401
    const response = await axios.get(baseUrl, {
      params,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://www.vinted.fr',
        'Referer': 'https://www.vinted.fr/',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
      timeout: config.scraper.timeout,
    });

    if (!response.data || !response.data.items) {
      logger.warn('No items found in Vinted response');
      return [];
    }

    // Parse listings
    const listings = response.data.items.slice(0, maxResults).map((item) => {
      // Extract price
      let price = 'N/A';
      if (item.price) {
        price = `${item.price} ${item.currency || '€'}`;
      }

      // Extract image
      let image = null;
      if (item.photo && item.photo.url) {
        image = item.photo.url;
      } else if (item.photos && item.photos.length > 0) {
        image = item.photos[0].url;
      }

      // Extract seller location
      let location = 'Non spécifié';
      if (item.user && item.user.city) {
        location = item.user.city;
      }

      // Extract date
      let date = null;
      if (item.created_at_ts) {
        const timestamp = item.created_at_ts;
        const dateObj = new Date(timestamp * 1000);
        date = dateObj.toLocaleDateString('fr-FR');
      }

      // Build link
      const link = `https://www.vinted.fr/items/${item.id}`;

      // Extract condition/state
      let condition = null;
      if (item.status) {
        condition = item.status;
      }

      return {
        title: item.title || 'N/A',
        price,
        link,
        image,
        location,
        date,
        condition,
        seller: item.user ? item.user.login : null,
        source: 'vinted',
      };
    });

    const duration = Date.now() - startTime;
    logger.info(`Vinted scraping completed: ${listings.length} items in ${duration}ms`);

    return listings;
  } catch (error) {
    // Check if it's an API error
    if (error.response) {
      logger.error('Vinted API error:', {
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      logger.error('Vinted scraping error:', error.message);
    }

    // Return empty array instead of throwing to not break the entire search
    return [];
  }
}

module.exports = { scrapeVinted };
