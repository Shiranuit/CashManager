'use strict';
/* eslint-disable no-alert, no-console */
class Logger {
  constructor (backend) {
    this.backend = backend;
    this.config = backend.config.logger;
  }

  _stringify(message) {

    if (message instanceof Error) {
      return this._stringify({
        message: message.message,
        stack: message.stack
      });
    }

    if (typeof message === 'object') {
      return JSON.stringify(message, null, 4);
    }

    return message.toString();
  }

  /**
   * Logs a debug message to the console.
   * @param {string} message
   * @returns
   */
  debug (message) {
    if (!this.config.debug) {
      return;
    }

    const date = new Date().toLocaleString();
    const lines = this._stringify(message).split('\n');
    for (const line of lines) {
      console.debug('\x1b[32m%s\x1b[0m', `[DEBUG][${date}] ${line}`);
    }
  }

  /**
   * Logs an info message to the console.
   * @param {string} message
   * @returns
   */
  info (message) {
    const date = new Date().toLocaleString();
    const lines = this._stringify(message).split('\n');
    for (const line of lines) {
      console.info('\x1b[36m%s\x1b[0m', `[INFO][${date}] ${line}`);
    }
  }

  /**
   * Logs a warn message to the console.
   * @param {string} message
   * @returns
   */
  warn (message) {
    const date = new Date().toLocaleString();
    const lines = this._stringify(message).split('\n');
    for (const line of lines) {
      console.warn('\x1b[33m%s\x1b[0m', `[WARN][${date}] ${line}`);
    }
  }

  /**
   * Logs an error message to the console.
   * @param {string} message
   * @returns
   */
  error (message) {
    const date = new Date().toLocaleString();
    const lines = this._stringify(message).split('\n');
    for (const line of lines) {
      console.error('\x1b[31m%s\x1b[0m', `[ERROR][${date}] ${line}`);
    }
  }
}

/* eslint-enable no-alert, no-console */

module.exports = Logger;