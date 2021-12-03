'use strict';

const BackendError = require('./backendError');

class ServiceUnavailable extends BackendError {
  constructor (message, id = '') {
    super(501, id, message, 'ServiceUnavailabeError');
  }
}

module.exports = ServiceUnavailable;