const redis = require('redis');
const config = require('../config');
const logger = require('./logger');

let redisClient = null;

async function connectRedis() {
  try {
    redisClient = redis.createClient({
      url: config.redis.url,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    return null;
  }
}

async function get(key) {
  if (!redisClient || !redisClient.isOpen) {
    logger.warn('Redis not available, skipping cache get');
    return null;
  }

  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis get error:', error);
    return null;
  }
}

async function set(key, value, ttl = config.redis.ttl) {
  if (!redisClient || !redisClient.isOpen) {
    logger.warn('Redis not available, skipping cache set');
    return false;
  }

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Redis set error:', error);
    return false;
  }
}

async function del(key) {
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Redis del error:', error);
    return false;
  }
}

async function disconnect() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis disconnected');
  }
}

module.exports = {
  connectRedis,
  get,
  set,
  del,
  disconnect,
};
