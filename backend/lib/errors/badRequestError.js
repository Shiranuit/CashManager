'use strict';

const BackendError = require('./backendError');

class BadRequest extends BackendError {
  constructor (message, id = '') {
    super(400, id, message, 'BadRequestError');
  }
}

module.exports = BadRequest;