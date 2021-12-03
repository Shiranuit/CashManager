'use strict';

const BackendError = require('./backendError');

class SecurityError extends BackendError {
  constructor (message, id = '') {
    super(502, id, message, 'SecurityError');
  }
}

module.exports = SecurityError;