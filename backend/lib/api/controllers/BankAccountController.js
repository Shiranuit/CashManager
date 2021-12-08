'use strict';

const BaseController = require('./BaseController');
const error = require('../../errors');

class BankAccountController extends BaseController {
  constructor () {
    super([
      { verb: 'get', path: '/_admin/:accountId', action: 'adminGetAccountInfo' },
      { verb: 'put', path: '/_admin/:accountId', action: 'adminUpdateBalance' },
      { verb: 'post', path: '/_admin/_create', action: 'adminCreateAccount' },
      { verb: 'delete', path: '/_admin/:accountId', action: 'adminDeleteAccount' },

      { verb: 'get', path: '/:accountId/:vcc', action: 'getAccountInfo'},
    ]);
  }

  /**
   * Initialize the controller.
   * @param {Backend} backend
   */
  async init (backend) {
    super.init(backend);
  }

  /**
   * Get the bankAccount information.
   * @param {number} accountId
   * @returns {Promise<number>}
   */
  async _getAccountInfo (accountId) {
    const bankAccount = await this.backend.ask('core:bankAccount:get', accountId);

    if (bankAccount === null) {
      error.throwError('api:bankAccount:not_found');
    }

    return bankAccount;
  }

  /**
   * Get the balance of a user.
   * @param {Request} request
   */
  async adminGetAccountInfo (req) {
    const accountId = req.getString('accountId');

    return await this._getAccountInfo(accountId);
  }

  /**
   * Get the bankAccount information.
   * @param {Request} req
   */
  async getAccountInfo (req) {
    const accountId = req.getString('accountId');
    const vcc = req.getString('vcc');

    const accountVerified = await this.backend.ask('core:bankAccount:verify', accountId, vcc);

    if (!accountVerified) {
      error.throwError('api:bankAccount:verification_failed');
    }

    const account = await this._getAccountInfo(req.getUser().id);

    return {
      balance: account.balance,
    };
  }

  /**
   * Update the balance of a bank Account.
   * @param {Request} req
   */
  async adminUpdateBalance (req) {
    const accountId = req.getString('accountId');
    const balance = req.getBodyInteger('balance');

    const bankAccount = await this.backend.ask('core:bankAccount:setBalance', accountId, balance);

    if (bankAccount === null) {
      error.throwError('api:bankAccount:not_found');
    }

    return bankAccount.balance;
  }

  /**
   * Create a new bankAccount
   * 
   * @param {Request} req 
   */
  async adminCreateAccount (req) {
    const balance = req.getBodyInteger('balance', 0);
    const account = await this.backend.ask('core:bankAccount:create', balance);
    return account;
  }

  /**
   * Delete a bankAccount
   * @param {Request} req 
   */
  async adminDeleteAccount (req) {
    const accountId = req.getString('accountId');
    await this.backend.ask('core:bankAccount:delete', accountId);
    return true;
  }
}

module.exports = BankAccountController;