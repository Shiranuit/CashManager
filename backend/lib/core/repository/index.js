'use strict';

const BankAccountRepository = require("./bankAccountRepository");
const ProductRepository = require("./productRepository");

class RepositoryModule {
  constructor () {
    this.backend = null;
    this.bankaccount = new BankAccountRepository();
    this.product = new ProductRepository();
  }

  /**
   * Initialize all the repositories
   * @param {Backend} backend
   */
  async init (backend) {
    this.backend = backend;
    await this.bankaccount.init(backend);
    await this.product.init(backend);
  }
}

module.exports = RepositoryModule;