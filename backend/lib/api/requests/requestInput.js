'use strict';

class RequestInput {
  constructor (request) {
    this.request = request;
    this.url = new URL(request.url, `http://${request.headers.host}`);
    this.body = {};
    this.args = {};
    this.action = null;
    this.controller = null;

    for (const [key, value] of this.url.searchParams) {
      this.args[key] = value;
    }
  }

  /**
   * Get header by name
   * @param {string} key 
   * @returns {string}
   */
  getHeader (key) {
    return this.request.headers[key.toLowerCase()];
  }

  /**
   * Get all the haders
   * @returns {{ [key: string]: string }}
   */
  getHeaders () {
    return this.request.headers || {};
  }

  /**
   * Get the raw request
   * @returns {http.IncommingMessage}
   */
  getRequest () {
    return this.request;
  }

  /**
   * Get the request body
   * @returns { [key: string]: any }
   */
  getBody () {
    return this.body || {};
  }

  /**
   * Get the request url path
   * @returns {string}
   */
  getPath () {
    return this.url.pathname;
  }

  /**
   * Get the request method
   * @returns {string}
   */
  getMethod () {
    return this.request.method;
  }

  /**
   * Get the controller action's name
   * @returns {string}
   */
  getAction () {
    return this.action;
  }

  /**
   * Get the controller name
   * @returns {string}
   */
  getController () {
    return this.controller;
  }


}

module.exports = RequestInput;