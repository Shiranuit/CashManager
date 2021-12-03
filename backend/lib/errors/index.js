'use strict';

const util = require('util');

const errorCodes = require('./errorCodes');
const InternalError = require('./internalError');

function throwError (errorId, ...errorMessage) {
  const error = errorCodes[errorId];
  if (! error) {
    throw new InternalError(`Error code not found: ${errorId}`);
  }

  const ErrorClass = error.type;
  throw new ErrorClass(util.format(error.message, ...errorMessage), errorId);
}

function getError (errorId, ...errorMessage) {
  const error = errorCodes[errorId];
  if (! error) {
    throw new InternalError(`Error code not found: ${errorId}`);
  }

  const ErrorClass = error.type;
  return new ErrorClass(util.format(error.message, ...errorMessage), errorId);
}

module.exports = {
  throwError,
  getError
};