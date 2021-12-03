'use strict';

const BackendError = require('../../errors/backendError');
const InternalError = require('../../errors/internalError');
const assert = require('../../utils/assertType');

class RequestResponse {
  constructor (response) {
    this.response = response;
    this.error = null;
    this.result = {};
  }

  /**
   * Set the request respond with the given value
   * @param {any} result
   */
  setResult (result) {
    this.result = result;
  }

  /**
   * Set the request in an errored state with the given error
   * @param {Error} err
   */
  setError (error) {
    if (! error || !(error instanceof Error)) {
      throw new InternalError('Cannot set non-error object as a request\'s error');
    }

    if (!(error instanceof BackendError)) {
      this.error = new InternalError(error.message);
      this.error.stack = error.stack;
      return;
    }

    this.error = error;
  }

  /**
   * Get the header value for the given header name
   * @param {string} name
   * @returns {string}
   */
  getHeader (name) {
    assert.assertString('header name', name);

    if (! name) {
      return true;
    }

    const lowerCased = name.toLowerCase();
    return this.response.headers[lowerCased];
  }

  /**
   * Remove the header with the given name
   * @param {string} name
   * @returns {boolean}
   */
  removeHeader (name) {
    assert.assertString('header name', name);

    if (! name) {
      return true;
    }

    const lowerCased = name.toLowerCase();
    delete this.response.headers[lowerCased];

    return true;
  }

  /**
   * Set the header value for the given header name
   * @param {string} name
   * @param {string | Array<string>} value
   * @returns {string}
   */
  setHeader (name, value) {
    assert.assertString('header name', name);

    this.response.setHeader(name, value);
  }

  /**
   * Return an object representing the reponse
   * @returns {Object}
   */
  toJSON () {
    if (this.error) {
      return {
        error: this.error.toJSON()
      };
    }

    return {
      result: this.result
    };
  }
}

module.exports = RequestResponse;