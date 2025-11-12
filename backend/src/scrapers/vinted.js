const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

// Liste des pays Vinted disponibles
const VINTED_COUNTRIES = [
  { code: 'fr', domain: 'vinted.fr', name: 'France' },
  { code: 'be', domain: 'vinted.be', name: 'Belgique' },
  { code: 'nl', domain: 'vinted.nl', name: 'Pays-Bas' },
  { code: 'lu', domain: 'vinted.lu', name: 'Luxembourg' },
  { code: 'es', domain: 'vinted.es', name: 'Espagne' },
  { code: 'it', domain: 'vinted.it', name: 'Italie' },
  { code: 'de', domain: 'vinted.de', name: 'Allemagne' },
  { code: 'at', domain: 'vinted.at', name: 'Autriche' },
  { code: 'cz', domain: 'vinted.cz', name: 'République Tchèque' },
  { code: 'pl', domain: 'vinted.pl', name: 'Pologne' },
  { code: 'lt', domain: 'vinted.lt', name: 'Lituanie' },
  { code: 'uk', domain: 'vinted.co.uk', name: 'Royaume-Uni' },
  { code: 'us', domain: 'vinted.com', name: 'États-Unis' },
  { code: 'ca', domain: 'vinted.ca', name: 'Canada' },
];

// Cache pour stocker les cookies par domaine
const cookieCache = new Map();

/**
 * Get session cookies for a Vinted domain
 * @param {string} domain - Vinted domain
 * @returns {Promise<string>} Cookie string
 */
async function getVintedCookies(domain) {
  // Check cache first
  const cached = cookieCache.get(domain);
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
    return cached.cookies;
  }

  try {
    const userAgent = config.scraper.userAgents[
      Math.floor(Math.random() * config.scraper.userAgents.length)
    ];

    // First, visit the homepage to get cookies
    const homeResponse = await axios.get(`https://www.${domain}`, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      },
      timeout: config.scraper.timeout,
      maxRedirects: 5,
    });

    // Extract cookies from response
    const cookies = homeResponse.headers['set-cookie'];
    const cookieString = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';

    // Cache the cookies
    cookieCache.set(domain, {
      cookies: cookieString,
      timestamp: Date.now(),
      userAgent,
    });

    return cookieString;
  } catch (error) {
    logger.warn(`Failed to get cookies for ${domain}:`, error.message);
    return '';
  }
}

/**
 * Scrape Vinted for a specific country
 * @param {string} query - Search query
 * @param {Object} country - Country object with domain and name
 * @param {number} maxResults - Max results
 * @returns {Promise<Array>} Array of listings
 */
async function scrapeVintedCountry(query, country, maxResults = 20) {
  try {
    // Get session cookies first
    const cookies = await getVintedCookies(country.domain);
    const cachedData = cookieCache.get(country.domain);
    const userAgent = cachedData ? cachedData.userAgent : config.scraper.userAgents[0];

    const baseUrl = `https://www.${country.domain}/api/v2/catalog/items`;

    const params = {
      search_text: query,
      catalog_ids: '',
      order: 'newest_first',
      page: 1,
      per_page: Math.min(maxResults, 96),
    };

    const response = await axios.get(baseUrl, {
      params,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': `https://www.${country.domain}`,
        'Referer': `https://www.${country.domain}/catalog?search_text=${encodeURIComponent(query)}`,
        'Cookie': cookies,
        'DNT': '1',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
      },
      timeout: config.scraper.timeout,
    });

    if (!response.data || !response.data.items) {
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

      const link = `https://www.${country.domain}/items/${item.id}`;

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
        country: country.name, // Ajouter le pays
        countryCode: country.code,
      };
    });

    logger.info(`Vinted ${country.name}: ${listings.length} items found`);
    return listings;
  } catch (error) {
    if (error.response) {
      logger.warn(`Vinted ${country.name} API error:`, {
        status: error.response.status,
      });
    } else {
      logger.warn(`Vinted ${country.name} error:`, error.message);
    }
    return [];
  }
}

/**
 * Scrape Vinted across all countries
 * @param {string} query - Search query (default: "iphone")
 * @param {number} maxResults - Maximum results per country
 * @returns {Promise<Array>} Array of all listings
 */
async function scrapeVinted(query = 'iphone', maxResults = 50) {
  const startTime = Date.now();
  logger.info(`Starting Vinted multi-country scraping for: ${query}`);

  try {
    // Calculer combien d'items par pays (répartir équitablement)
    const resultsPerCountry = Math.ceil(maxResults / VINTED_COUNTRIES.length);

    // Scraper tous les pays en parallèle
    const promises = VINTED_COUNTRIES.map(country =>
      scrapeVintedCountry(query, country, resultsPerCountry)
    );

    const results = await Promise.allSettled(promises);

    // Combiner tous les résultats
    let allListings = [];
    let successCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allListings = allListings.concat(result.value);
        successCount++;
      }
    });

    // Limiter au nombre max demandé
    allListings = allListings.slice(0, maxResults);

    const duration = Date.now() - startTime;
    logger.info(
      `Vinted multi-country scraping completed: ${allListings.length} items from ${successCount}/${VINTED_COUNTRIES.length} countries in ${duration}ms`
    );

    return allListings;
  } catch (error) {
    logger.error('Vinted multi-country scraping error:', error.message);
    return [];
  }
}

module.exports = { scrapeVinted, scrapeVintedCountry, VINTED_COUNTRIES };
