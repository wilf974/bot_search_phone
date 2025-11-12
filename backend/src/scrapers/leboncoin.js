const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const config = require('../config');
const logger = require('../utils/logger');

// Ajouter le plugin stealth pour éviter la détection
puppeteer.use(StealthPlugin());

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
    // Launch browser avec stealth mode
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080',
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Set random user agent
    const userAgent = config.scraper.userAgents[
      Math.floor(Math.random() * config.scraper.userAgents.length)
    ];
    await page.setUserAgent(userAgent);

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Ajouter plus de headers pour éviter la détection
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });

    // Build URL
    const searchUrl = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(query)}&category=15`;
    logger.debug(`Navigating to: ${searchUrl}`);

    // Navigate to search page
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: config.scraper.timeout,
    });

    // Attendre un peu pour le JavaScript
    await page.waitForTimeout(3000);

    // DEBUG: Capturer ce que voit Puppeteer
    await page.screenshot({ path: '/tmp/leboncoin-debug.png', fullPage: true });
    logger.info('Screenshot saved to /tmp/leboncoin-debug.png');

    // Attendre que la page soit chargée (plusieurs sélecteurs possibles)
    await Promise.race([
      page.waitForSelector('[data-test-id="ad"]', { timeout: 10000 }),
      page.waitForSelector('a[data-qa-id="aditem_container"]', { timeout: 10000 }),
      page.waitForSelector('article', { timeout: 10000 }),
    ]).catch(() => logger.warn('No ads selector found, trying to parse anyway'));

    // Extract listings - essayer plusieurs sélecteurs
    const listings = await page.evaluate((max) => {
      const items = [];

      // Essayer plusieurs sélecteurs
      let adElements = document.querySelectorAll('[data-test-id="ad"]');
      if (adElements.length === 0) {
        adElements = document.querySelectorAll('a[data-qa-id="aditem_container"]');
      }
      if (adElements.length === 0) {
        adElements = document.querySelectorAll('article');
      }

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
