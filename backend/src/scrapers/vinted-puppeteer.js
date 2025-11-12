const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

// Browser instance cache (réutilisé entre requêtes)
let browserInstance = null;
let browserStartTime = null;
const BROWSER_LIFETIME = 10 * 60 * 1000; // 10 minutes

// Liste réduite des pays les plus populaires (pour performance)
const VINTED_COUNTRIES_PRIORITY = [
  { code: 'fr', domain: 'vinted.fr', name: 'France' },
  { code: 'be', domain: 'vinted.be', name: 'Belgique' },
  { code: 'uk', domain: 'vinted.co.uk', name: 'Royaume-Uni' },
  { code: 'de', domain: 'vinted.de', name: 'Allemagne' },
  { code: 'es', domain: 'vinted.es', name: 'Espagne' },
  { code: 'it', domain: 'vinted.it', name: 'Italie' },
];

/**
 * Get or create browser instance
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function getBrowser() {
  // Reuse existing browser if still valid
  if (browserInstance && browserStartTime && Date.now() - browserStartTime < BROWSER_LIFETIME) {
    try {
      // Test if browser is still responsive
      const pages = await browserInstance.pages();
      if (pages.length >= 0) {
        return browserInstance;
      }
    } catch (error) {
      logger.warn('Browser instance is no longer valid, creating new one');
    }
  }

  // Close old browser if exists
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (error) {
      // Ignore errors when closing
    }
  }

  // Create new browser
  logger.info('Launching new Puppeteer browser instance');
  browserInstance = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  browserStartTime = Date.now();
  return browserInstance;
}

/**
 * Scrape Vinted for a specific country using Puppeteer
 * @param {string} query - Search query
 * @param {Object} country - Country object with domain and name
 * @param {number} maxResults - Max results
 * @returns {Promise<Array>} Array of listings
 */
async function scrapeVintedCountryPuppeteer(query, country, maxResults = 20) {
  let page = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to search page
    const searchUrl = `https://www.${country.domain}/catalog?search_text=${encodeURIComponent(query)}&order=newest_first`;
    logger.info(`Scraping ${country.name}: ${searchUrl}`);

    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for page to be fully loaded
    await page.waitForTimeout(3000);

    // Debug: Get HTML structure to find correct selectors
    const debug = await page.evaluate(() => {
      const mainContent = document.querySelector('main, [role="main"], #content, .catalog');
      if (!mainContent) return { found: false, selectors: [] };

      // Find all links to items
      const itemLinks = Array.from(document.querySelectorAll('a[href*="/items/"]'));
      const uniqueClasses = new Set();

      itemLinks.forEach(link => {
        // Get parent container classes
        let parent = link.parentElement;
        for (let i = 0; i < 3 && parent; i++) {
          if (parent.className) {
            parent.className.split(' ').forEach(c => {
              if (c && !c.startsWith('_')) uniqueClasses.add(c);
            });
          }
          parent = parent.parentElement;
        }
      });

      return {
        found: true,
        itemLinksCount: itemLinks.length,
        classes: Array.from(uniqueClasses).slice(0, 20),
      };
    });

    logger.info(`${country.name} debug:`, debug);

    // Extract items from the page using generic approach
    const items = await page.evaluate((countryInfo) => {
      const results = [];

      // Find all item links (most reliable approach)
      const itemLinks = document.querySelectorAll('a[href*="/items/"]');
      const processed = new Set();

      itemLinks.forEach((link) => {
        try {
          const href = link.getAttribute('href');
          if (!href || processed.has(href)) return;
          processed.add(href);

          // Get the container (usually parent or grandparent)
          let container = link.closest('div[class*="item"], div[class*="Item"], article, li');
          if (!container) container = link.parentElement?.parentElement || link.parentElement;
          if (!container) return;

          // Extract title - try link text or nearby text
          let title = link.getAttribute('title') ||
                     link.getAttribute('aria-label') ||
                     link.textContent.trim();

          // Clean title (remove extra whitespace)
          title = title.replace(/\s+/g, ' ').trim();
          if (!title || title.length < 3) return;

          // Extract image
          const img = container.querySelector('img');
          const image = img ? (img.getAttribute('src') || img.getAttribute('data-src')) : null;

          // Extract price - look for currency symbols or price text
          const priceEl = container.querySelector('[class*="price"], [class*="Price"]');
          let price = 'N/A';
          if (priceEl) {
            price = priceEl.textContent.trim();
          } else {
            // Fallback: search for currency in text
            const text = container.textContent;
            const priceMatch = text.match(/€\s*\d+[,.]?\d*|\d+[,.]?\d*\s*€|£\s*\d+[,.]?\d*|\$\s*\d+[,.]?\d*/);
            if (priceMatch) price = priceMatch[0];
          }

          const fullLink = href.startsWith('http') ? href : `https://www.${countryInfo.domain}${href}`;

          results.push({
            title,
            price,
            link: fullLink,
            image,
            source: 'vinted',
            country: countryInfo.name,
            countryCode: countryInfo.code,
          });
        } catch (err) {
          // Skip items with errors
        }
      });

      return results;
    }, country);

    logger.info(`${country.name}: Found ${items.length} items`);

    await page.close();
    return items.slice(0, maxResults);

  } catch (error) {
    logger.error(`Puppeteer scraping error for ${country.name}:`, error.message);

    if (page) {
      try {
        await page.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }

    return [];
  }
}

/**
 * Scrape Vinted across multiple countries using Puppeteer
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum total results
 * @returns {Promise<Array>} Array of all listings
 */
async function scrapeVintedPuppeteer(query = 'iphone', maxResults = 50) {
  const startTime = Date.now();
  logger.info(`Starting Vinted Puppeteer scraping for: ${query}`);

  try {
    // Calculate items per country
    const resultsPerCountry = Math.ceil(maxResults / VINTED_COUNTRIES_PRIORITY.length);

    // Scrape countries sequentially to avoid overwhelming the system
    // (parallel would be too resource-intensive with Puppeteer)
    const allListings = [];

    for (const country of VINTED_COUNTRIES_PRIORITY) {
      if (allListings.length >= maxResults) break;

      const items = await scrapeVintedCountryPuppeteer(query, country, resultsPerCountry);
      allListings.push(...items);

      // Small delay between countries
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Limit to max results
    const finalResults = allListings.slice(0, maxResults);

    const duration = Date.now() - startTime;
    logger.info(
      `Vinted Puppeteer scraping completed: ${finalResults.length} items from ${VINTED_COUNTRIES_PRIORITY.length} countries in ${duration}ms`
    );

    return finalResults;
  } catch (error) {
    logger.error('Vinted Puppeteer scraping error:', error.message);
    return [];
  }
}

/**
 * Close browser instance (called on app shutdown)
 */
async function closeBrowser() {
  if (browserInstance) {
    try {
      await browserInstance.close();
      browserInstance = null;
      logger.info('Puppeteer browser closed');
    } catch (error) {
      logger.error('Error closing browser:', error.message);
    }
  }
}

module.exports = {
  scrapeVintedPuppeteer,
  scrapeVintedCountryPuppeteer,
  closeBrowser,
  VINTED_COUNTRIES_PRIORITY,
};
