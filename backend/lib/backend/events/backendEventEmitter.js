'use strict';

const EventEmitter = require('events');
const assert = require('assert');

class BackendEventEmitter extends EventEmitter {
  constructor () {
    super();
    this._ask = new Map();
  }

  /**
   * Declare a callback that will be called when the given event is emitted.
   * @param {string} event
   * @param {callback} fn
   */
  onAsk (event, fn) {
    assert(typeof fn === 'function', `Cannot listen to ask event "${event}": "${fn}" is not a function`);
    assert(!this._ask.has(event), `Cannot add a listener to the ask event "${event}": event has already an answerer`);

    this._ask.set(event, fn);
  }

  /**
   * Call the given callback associated to the given event with payload
   * return the result of the callback
   * @param {string} event
   * @param  {...any} payload
   * @returns {any}
   */
  async ask (event, ...payload) {
    if (!this._ask.has(event)) {
      throw new Error(`Cannot ask event "${event}": no listener`);
    }

    const fn = this._ask.get(event);

    return await fn(...payload);
  }

}

module.exports = BackendEventEmitter;