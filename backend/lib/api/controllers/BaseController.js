'use strict';

class BaseController {
  constructor (actions = []) {
    this.__actions = new Set(actions);
    this.backend = null;
  }

  async init (backend) {
    this.backend = backend;
  }
}

module.exports = BaseController;