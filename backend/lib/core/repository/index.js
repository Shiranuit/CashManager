'use strict';

class RepositoryModule {
  constructor () {
    this.backend = null;
  }

  /**
   * Initialize all the repositories
   * @param {Backend} backend
   */
  async init (backend) {
    this.backend = backend;
  }
}

module.exports = RepositoryModule;