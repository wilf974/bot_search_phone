import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds (scraping peut prendre du temps)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Search for items
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum results per source
 * @returns {Promise<Object>} Search results
 */
export async function searchItems(query = 'iphone', maxResults = 50) {
  try {
    const response = await api.get('/search', {
      params: {
        query,
        maxResults,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.error || 'Erreur lors de la recherche');
    } else if (error.request) {
      // Request made but no response
      throw new Error('Impossible de contacter le serveur');
    } else {
      // Something else happened
      throw new Error('Erreur inattendue lors de la recherche');
    }
  }
}

/**
 * Health check
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck() {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Service unavailable');
  }
}

export default api;
