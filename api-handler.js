/**
 * API Response Handler & Status Codes
 * Standardizes API responses with proper HTTP status codes
 */

/**
 * HTTP Status Codes with descriptions
 */
const HTTP_STATUS = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // 3xx Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  
  // 4xx Client Error
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // 5xx Server Error
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Response object with consistent format
 */
class ApiResponse {
  constructor(status, data = null, message = '', errors = null) {
    this.status = status;
    this.message = message || this.getDefaultMessage(status);
    this.data = data;
    this.timestamp = new Date().toISOString();
    if (errors) {
      this.errors = Array.isArray(errors) ? errors : [errors];
    }
  }
  
  getDefaultMessage(status) {
    const messages = {
      200: 'Request successful',
      201: 'Resource created successfully',
      202: 'Request accepted for processing',
      204: 'No content',
      400: 'Bad request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Resource not found',
      409: 'Conflict',
      422: 'Unprocessable entity',
      429: 'Too many requests',
      500: 'Internal server error',
      501: 'Not implemented',
      503: 'Service unavailable'
    };
    return messages[status] || 'Unknown status';
  }
}

/**
 * Create success response (200 OK)
 * @param {any} data - Response data
 * @param {string} message - Custom message
 * @returns {ApiResponse} Response object
 */
function success(data, message = '') {
  return new ApiResponse(HTTP_STATUS.OK, data, message);
}

/**
 * Create created response (201 Created)
 * @param {any} data - Created resource data
 * @param {string} message - Custom message
 * @returns {ApiResponse} Response object
 */
function created(data, message = '') {
  return new ApiResponse(HTTP_STATUS.CREATED, data, message || 'Resource created successfully');
}

/**
 * Create bad request response (400)
 * @param {string|array} errors - Error message(s)
 * @param {string} message - Custom message
 * @returns {ApiResponse} Response object
 */
function badRequest(errors, message = '') {
  return new ApiResponse(HTTP_STATUS.BAD_REQUEST, null, message || 'Invalid request', errors);
}

/**
 * Create unauthorized response (401)
 * @param {string} message - Custom message
 * @returns {ApiResponse} Response object
 */
function unauthorized(message = '') {
  return new ApiResponse(HTTP_STATUS.UNAUTHORIZED, null, message || 'Unauthorized access');
}

/**
 * Create forbidden response (403)
 * @param {string} message - Custom message
 * @returns {ApiResponse} Response object
 */
function forbidden(message = '') {
  return new ApiResponse(HTTP_STATUS.FORBIDDEN, null, message || 'Access forbidden');
}

/**
 * Create not found response (404)
 * @param {string} resource - Resource name
 * @returns {ApiResponse} Response object
 */
function notFound(resource = 'Resource') {
  return new ApiResponse(HTTP_STATUS.NOT_FOUND, null, `${resource} not found`);
}

/**
 * Create conflict response (409)
 * @param {string} message - Custom message
 * @returns {ApiResponse} Response object
 */
function conflict(message = '') {
  return new ApiResponse(HTTP_STATUS.CONFLICT, null, message || 'Resource conflict');
}

/**
 * Create unprocessable entity response (422)
 * @param {string|array} errors - Validation error(s)
 * @returns {ApiResponse} Response object
 */
function unprocessableEntity(errors) {
  return new ApiResponse(HTTP_STATUS.UNPROCESSABLE_ENTITY, null, 'Validation failed', errors);
}

/**
 * Create rate limit response (429)
 * @param {string} message - Custom message
 * @returns {ApiResponse} Response object
 */
function tooManyRequests(message = '') {
  return new ApiResponse(HTTP_STATUS.TOO_MANY_REQUESTS, null, message || 'Too many requests. Please try again later.');
}

/**
 * Create server error response (500)
 * @param {string} message - Custom message
 * @param {any} details - Error details for logging
 * @returns {ApiResponse} Response object
 */
function internalError(message = '', details = null) {
  return new ApiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, null, message || 'Internal server error');
}

/**
 * Create service unavailable response (503)
 * @param {string} message - Custom message
 * @returns {ApiResponse} Response object
 */
function serviceUnavailable(message = '') {
  return new ApiResponse(HTTP_STATUS.SERVICE_UNAVAILABLE, null, message || 'Service temporarily unavailable');
}

/**
 * Middleware to send API responses
 * Usage: app.use(apiResponseHandler)
 */
function apiResponseHandler(req, res, next) {
  // Override res.json to ensure consistent response format
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    if (data instanceof ApiResponse) {
      res.status(data.status);
      return originalJson({
        status: data.status,
        message: data.message,
        data: data.data,
        errors: data.errors || undefined,
        timestamp: data.timestamp
      });
    }
    return originalJson(data);
  };
  
  // Add helper methods to response object
  res.apiSuccess = (data, message = '') => res.json(success(data, message));
  res.apiCreated = (data, message = '') => res.status(201).json(created(data, message));
  res.apiBadRequest = (errors, message = '') => res.status(400).json(badRequest(errors, message));
  res.apiUnauthorized = (message = '') => res.status(401).json(unauthorized(message));
  res.apiForbidden = (message = '') => res.status(403).json(forbidden(message));
  res.apiNotFound = (resource = 'Resource') => res.status(404).json(notFound(resource));
  res.apiConflict = (message = '') => res.status(409).json(conflict(message));
  res.apiValidationError = (errors) => res.status(422).json(unprocessableEntity(errors));
  res.apiTooManyRequests = (message = '') => res.status(429).json(tooManyRequests(message));
  res.apiError = (message = '', details = null) => res.status(500).json(internalError(message, details));
  res.apiServiceUnavailable = (message = '') => res.status(503).json(serviceUnavailable(message));
  
  next();
}

/**
 * Pagination helper
 * @param {number} page - Current page (1-indexed)
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Pagination metadata
 */
function paginate(page = 1, limit = 20, total = 0) {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const totalPages = Math.ceil(total / limitNum);
  const offset = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    offset,
    total,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1
  };
}

/**
 * Create paginated response
 * @param {array} data - Array of items
 * @param {object} pagination - Pagination metadata
 * @param {string} message - Custom message
 * @returns {object} Response with pagination
 */
function paginatedResponse(data, pagination, message = '') {
  return {
    status: HTTP_STATUS.OK,
    message: message || 'Data retrieved successfully',
    data,
    pagination,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  HTTP_STATUS,
  ApiResponse,
  success,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internalError,
  serviceUnavailable,
  apiResponseHandler,
  paginate,
  paginatedResponse
};
