/**
 * Utility functions for Kisan Connect
 * Includes helpers for validation, logging, hashing, and common operations
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Get current ISO timestamp
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Hash password using bcrypt (production-grade security)
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Promise resolving to hashed password
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare plain password with hash (use for login validation)
 * @param {string} password - Plain text password
 * @param {string} hash - Password hash to compare against
 * @returns {Promise<boolean>} Promise resolving to true if password matches
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate unique ID using timestamp and random suffix
 * @returns {string} Unique ID
 */
function generateId() {
  return Date.now().toString() + crypto.randomBytes(8).toString('hex');
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indian format: 10 digits starting with 6-9)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
function isValidPhoneNumber(phone) {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} {valid: boolean, errors: array}
 */
function validatePasswordStrength(password) {
  const errors = [];
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize input to prevent injection attacks
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  // Remove HTML/script tags and trim whitespace
  return input.trim().replace(/[<>]/g, '').slice(0, 500);
}

/**
 * Log message with timestamp and level
 * @param {string} level - Log level (INFO, ERROR, WARN, DEBUG)
 * @param {string} message - Message to log
 * @param {any} data - Additional data to log
 */
function log(level, message, data = '') {
  const timestamp = getTimestamp();
  console.log(`[${timestamp}] [${level}] ${message}`, data);
}

/**
 * Validate required fields in an object
 * @param {object} obj - Object to validate
 * @param {array} requiredFields - Array of required field names
 * @returns {object} {valid: boolean, errors: array}
 */
function validateRequiredFields(obj, requiredFields) {
  const errors = [];
  
  for (const field of requiredFields) {
    if (!obj[field] || (typeof obj[field] === 'string' && !obj[field].trim())) {
      errors.push(`${field} is required`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * API Response formatter with consistent structure
 * @param {number} status - HTTP status code
 * @param {any} data - Response data
 * @param {string} message - Response message
 * @returns {object} Formatted response
 */
function createResponse(status, data = null, message = '') {
  return {
    status,
    message: message || (status === 200 ? 'Success' : 'Error'),
    data,
    timestamp: getTimestamp()
  };
}

/**
 * Middleware to validate input (sanitize and validate required fields)
 * @param {array} requiredFields - Array of required field names
 * @returns {function} Express middleware function
 */
function validateInputMiddleware(requiredFields) {
  return (req, res, next) => {
    // Sanitize all input fields
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
    
    // Validate required fields
    const validation = validateRequiredFields(req.body, requiredFields);
    if (!validation.valid) {
      return res.status(400).json(createResponse(400, null, validation.errors[0]));
    }
    
    next();
  };
}

module.exports = {
  getTimestamp,
  hashPassword,
  comparePassword,
  generateId,
  isValidEmail,
  isValidPhoneNumber,
  validatePasswordStrength,
  sanitizeInput,
  log,
  validateRequiredFields,
  createResponse,
  validateInputMiddleware
};
