const puppeteer = require('puppeteer');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Scrape Leboncoin for iPhone listings
 * @param {string} query - Search query (default: "iphone")
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} Array of listings
 */
async function scrapeLeboncoin(query = 'iphone', maxResults = 50) {
  const startTime = Date.now();
  logger.info(`Starting Leboncoin scraping for: ${query}`);

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();

    // Set random user agent
    const userAgent = config.scraper.userAgents[
      Math.floor(Math.random() * config.scraper.userAgents.length)
    ];
    await page.setUserAgent(userAgent);

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Build URL
    const searchUrl = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(query)}&category=15`;
    logger.debug(`Navigating to: ${searchUrl}`);

    // Navigate to search page
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: config.scraper.timeout,
    });

    // Wait for listings to load
    await page.waitForSelector('[data-test-id="ad"]', { timeout: 10000 });

    // Extract listings
    const listings = await page.evaluate((max) => {
      const items = [];
      const adElements = document.querySelectorAll('[data-test-id="ad"]');

      for (let i = 0; i < Math.min(adElements.length, max); i++) {
        const ad = adElements[i];

        try {
          // Extract title
          const titleElement = ad.querySelector('[data-qa-id="aditem_title"]');
          const title = titleElement ? titleElement.textContent.trim() : 'N/A';

          // Extract price
          const priceElement = ad.querySelector('[data-qa-id="aditem_price"]');
          let price = 'N/A';
          if (priceElement) {
            price = priceElement.textContent.trim();
          }

          // Extract link
          const linkElement = ad.querySelector('a[href]');
          const link = linkElement
            ? `https://www.leboncoin.fr${linkElement.getAttribute('href')}`
            : null;

          // Extract image
          const imgElement = ad.querySelector('img');
          const image = imgElement ? imgElement.getAttribute('src') : null;

          // Extract location
          const locationElement = ad.querySelector('[data-qa-id="aditem_location"]');
          const location = locationElement
            ? locationElement.textContent.trim()
            : 'Non spécifié';

          // Extract date
          const dateElement = ad.querySelector('[data-qa-id="aditem_date"]');
          const date = dateElement ? dateElement.textContent.trim() : null;

          if (title && link) {
            items.push({
              title,
              price,
              link,
              image,
              location,
              date,
              source: 'leboncoin',
            });
          }
        } catch (error) {
          console.error('Error parsing ad:', error);
        }
      }

      return items;
    }, maxResults);

    const duration = Date.now() - startTime;
    logger.info(`Leboncoin scraping completed: ${listings.length} items in ${duration}ms`);

    await browser.close();
    return listings;
  } catch (error) {
    logger.error('Leboncoin scraping error:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

module.exports = { scrapeLeboncoin };
