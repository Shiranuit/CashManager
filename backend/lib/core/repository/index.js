'use strict';

const BankAccountRepository = require("./bankAccountRepository");

class RepositoryModule {
  constructor () {
    this.backend = null;
    this.bankaccount = new BankAccountRepository();
  }

  /**
   * Initialize all the repositories
   * @param {Backend} backend
   */
  async init (backend) {
    this.backend = backend;
    await this.bankaccount.init(backend);
  }
}

module.exports = RepositoryModule;