'use strict';

const error = require('../../errors');
const RequestInput = require('./requestInput');
const RequestResponse = require('./requestResponse');
const { get, isPlainObject } = require('../../utils/safeObject');

class Request {
  constructor (request, response) {
    this.input = new RequestInput(request);
    this.response = new RequestResponse(response);
    this.routerPart = null;
    this.context = {};
  }

  /**
   * Get the token from the request.
   * @returns {string}
   */
  getJWT () {
    const jwt = this.input.getHeader('Authorization');
    return jwt && jwt !== 'null' ? jwt : null;
  }

  /**
   * Get the user from the request.
   * @returns {User}
   */
  getUser () {
    return this.context.user || null;
  }

  /**
   * Return true if the request is not authenticated
   * @returns {boolean}
   */
  isAnonymous () {
    return !this.context.user || this.context.user.id === null;
  }

  /**
   * Get the controller action's name that will be executed.
   * @returns {string}
   */
  getAction () {
    return this.input.getAction();
  }

  /**
   * Get the controller name
   * @returns {string}
   */
  getController () {
    return this.input.getController();
  }

  /**
   * Set the request respond with the given value
   * @param {any} result
   */
  setResult (result) {
    this.response.setResult(result);
  }

  /**
   * Set the request in an errored state with the given error
   * @param {Error} err
   */
  setError (err) {
    this.response.setError(err);
  }

  /**
   * Get the request body.
   * @returns {{ [key: string]: any }}
   */
  getBody () {
    return this.input.body;
  }

  /**
   * Get the query parameters along with the templated parameters
   * @returns {{[key: string]: string}}
   */
  getArgs () {
    return this.input.args;
  }

  /**
   * Gets a parameter from a request arguments and checks that it is a boolean
   * Contrary to other parameter types, an unset boolean does not trigger an
   * error, instead it's considered as 'false'
   *
   * @param {string} name parameter name
   * @return {boolean}
   */
  getBoolean (name) {
    return get(this.input.args, name) !== undefined;
  }

  /**
   * Gets a parameter from a request arguments and checks that it is a number
   *
   * @param {string} name parameter name
   * @param {number} def default value to return if the parameter is not set
   * @return {number}
   *
   * @throws {request:invalid:missing_argument} If parameter not found and no default
   *                                       value provided
   * @throws {request:invalid:invalid_type} If the fetched parameter is not a number
   */
  getNumber (name, def = null) {
    return this._getNumber(this.input.args, name, name, def);
  }

  /**
   * Gets a parameter from a request arguments and checks that it is an integer
   *
   * @param {string} name parameter name
   * @param {integer} def default value to return if the parameter is not set
   * @return {integer}
   *
   * @throws {request:invalid:missing_argument} If parameter not found and no default
   *                                       value provided
   * @throws {request:invalid:invalid_type} If the fetched parameter is not a number
   */
  getInteger (name, def = null) {
    return this._getInteger(this.input.args, name, name, def);
  }

  /**
   * Gets a parameter from a request arguments and checks that it is an array
   *
   * @param {string} name parameter name
   * @param {Array} def default value to return if the parameter is not set
   * @return {Array}
   *
   * @throws {request:invalid:missing_argument} If parameter not found and no default
   *                                       value provided
   * @throws {request:invalid:invalid_type} If the fetched parameter is not a number
   */
  getArray (name, def = null) {
    return this._getArray(this.input.args, name, name, def);
  }

  /**
   * Gets a parameter from a request arguments and checks that it is a string
   *
   * @param {string} name parameter name
   * @param {string} def default value to return if the parameter is not set
   * @return {string}
   *
   * @throws {request:invalid:missing_argument} If parameter not found and no default
   *                                       value provided
   * @throws {request:invalid:invalid_type} If the fetched parameter is not a number
   */
  getString (name, def = null) {
    return this._getString(this.input.args, name, name, def);
  }

  /**
   * Gets a parameter from a request arguments and checks that it is an object
   *
   * @param {string} name parameter name
   * @param {object} def default value to return if the parameter is not set
   * @return {object}
   *
   * @throws {request:invalid:missing_argument} If parameter not found and no default
   *                                       value provided
   * @throws {request:invalid:invalid_type} If the fetched parameter is not a number
   */
  getObject (name, def = null) {
    return this._getObject(this.input.args, name, name, def);
  }

  /**
   * Gets a parameter from a request body and checks that it is a boolean.
   * Contrary to other parameter types, an unset boolean does not trigger an
   * error, instead it's considered as 'false'
   *
   * @param {string} name parameter name
   * @return {boolean}
   */
  getBodyBoolean (name) {
    const body = this.input.body;

    if (body === null) {
      return false;
    }

    const value = get(this.input.body, name);

    if (value === undefined || value === null) {
      return false;
    } else if (typeof value !== 'boolean') {
      error.throwError('request:invalid:invalid_type', `body.${name}`, 'boolean');
    } else {
      return Boolean(value);
    }
  }

  /**
   * Gets a parameter from a request body and checks that it is a number
   *
   * @param {string} name parameter name
   * @param {number} def default value to return if the parameter is not set
   * @return {number}
   *
   * @throws {request:invalid:body_required} If no default value provided and no
   *                                    request body set
   * @throws {request:invalid:missing_argument} If parameter not found and no default
   *                                       value provided
   * @throws {request:invalid:invalid_type} If the fetched parameter is not a number
   */
  getBodyNumber (name, def = null) {
    const body = this.input.body;

    if (body === null) {
      if (def !== null) {
        return def;
      }

      throw error.throwError('request:invalid:body_required');
    }

    return this._getNumber(this.input.body, name, `body.${name}`, def);
  }

  /**
   * Gets a parameter from a request body and checks that it is an integer
   *
   * @param {string} name parameter name
   * @param {integer} def default value to return if the parameter is not set
   * @return {integer}
   *
   * @throws {request:invalid:body_required} If no default value provided and no
   *                                    request body set
   * @throws {request:invalid:missing_argument} If parameter not found and no default
   *                                       value provided
   * @throws {request:invalid:invalid_type} If the fetched parameter is not a number
   */
  getBodyInteger (name, def = null) {
    return this._getInteger(this.input.body, name, `body.${name}`, def);
  }

  /**
   * Gets a parameter from a request body and checks that it is a string
   *
   * @param {string} name parameter name
   * @param {string} def default value to return if the parameter is not set
   * @return {string}
   *
   * @throws {request:invalid:body_required} If no default value provided and no
   *                                    request body set
   * @throws {request:invalid:missing_argument} If parameter not found and no default
   *                                       value provided
   * @throws {request:invalid:invalid_type} If the fetched parameter is not a number
   */
  getBodyString (name, def = null) {
    return this._getString(this.input.body, name, `body.${name}`, def);
  }

  /**
   * Gets a parameter from a request body and checks that it is an object
   *
   * @param {string} name parameter name
   * @param {object} def default value to return if the parameter is not set
   * @return {object}
   *
   * @throws {request:invalid:body_required} If no default value provided and no
   *                                    request body set
   * @throws {request:invalid:missing_argument} If parameter not found and no default
   *                                       value provided
   * @throws {request:invalid:invalid_type} If the fetched parameter is not a number
   */
  getBodyObject (name, def = null) {
    return this._getObject(this.input.body, name, `body.${name}`, def);
  }

  /**
   * Gets a parameter from a request body and checks that it is an array
   *
   * @param {string} name parameter name
   * @param {array} def default value to return if the parameter is not set
   * @return {array}
   *
   * @throws {request:invalid:body_required} If no default value provided and no
   *                                    request body set
   * @throws {request:invalid:missing_argument} If parameter not found and no default
   *                                       value provided
   * @throws {request:invalid:invalid_type} If the fetched parameter is not a number
   */
  getBodyArray (name, def = null) {
    return this._getArray(this.input.body, name, `body.${name}`, def);
  }

  _getNumber (
    obj,
    name,
    errorName,
    def
  ) {
    let value = get(obj, name);

    if (value === undefined || value === null) {
      if (def !== null) {
        return def;
      }

      error.throwError('request:invalid:missing_argument', errorName);
    }

    const _value = Number.parseFloat(value);

    if (Number.isNaN(_value)) {
      error.throwError('request:invalid:invalid_type', errorName, 'number');
    }

    return _value;
  }

  _getInteger (
    obj,
    name,
    errorName,
    def
  ) {
    let value = get(obj, name);

    if (value === undefined || value === null) {
      if (def !== null) {
        return def;
      }

      error.throwError('request:invalid:missing_argument', errorName);
    }

    const _value = Number.parseInt(value);

    if (Number.isNaN(_value) || !Number.isSafeInteger(_value)) {
      error.throwError('request:invalid:invalid_type', errorName, 'integer');
    }

    return _value;
  }

  _getString (
    obj,
    name,
    errorName,
    def
  ) {
    let value = get(obj, name);

    if (value === undefined || value === null) {
      if (def !== null) {
        return def;
      }

      error.throwError('request:invalid:missing_argument', errorName);
    }

    if (typeof value !== 'string') {
      error.throwError('request:invalid:invalid_type', errorName, 'string');
    }

    return value;
  }

  _getArray (
    obj,
    name,
    errorName,
    def
  ) {
    let value = get(obj, name);

    if (value === undefined || value === null) {
      if (def !== null) {
        return def;
      }

      error.throwError('request:invalid:missing_argument', errorName);
    }

    if (!Array.isArray(value)) {
      error.throwError('request:invalid:invalid_type', errorName, 'array');
    }

    return value;
  }

  _getObject (
    obj,
    name,
    errorName,
    def
  ) {
    let value = get(obj, name);

    if (value === undefined || value === null) {
      if (def !== null) {
        return def;
      }

      error.throwError('request:invalid:missing_argument', errorName);
    }

    if (!isPlainObject(value)) {
      error.throwError('request:invalid:invalid_type', errorName, 'object');
    }

    return value;
  }
}

module.exports = Request;