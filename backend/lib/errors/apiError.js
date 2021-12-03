'use strict';

const BackendError = require('./backendError');

class ApiError extends BackendError {
  constructor (message, id = '') {
    super(504, id, message, 'ApiError');
  }
}

module.exports = ApiError;