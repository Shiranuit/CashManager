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
   * Get the BankAccount informations.
   * @param {Request} request
   * 
   * @openapi
   * @action adminGetAccountInfo
   * @description Get the BankAccount informations
   * @templateParam {string} accountId The id of the BankAccount.
   * @successField {number:1} balance The balance of the BankAccount.
   * @successField {string:"cc371db2-8f9a-4f28-bb4d-2220906b371e"} id The id of the BankAccount.
   * @successField {string:"6666"} vcc The BankAccount visual cryptographic code
   * @error api:bankAccount:not_found
   */
  async adminGetAccountInfo (req) {
    const accountId = req.getString('accountId');

    return await this._getAccountInfo(accountId);
  }

  /**
   * Get the BankAccount information.
   * @param {Request} req
   * 
   * @openapi
   * @action getAccountInfo
   * @description Get the BankAccount informations
   * @templateParam {string} accountId The id of the BankAccount.
   * @templateParam {string} vcc The vcc associated to the BankAccount.
   * @successField {number:0} balance The balance of the BankAccount.
   * @error api:bankAccount:verification_failed
   * @error api:bankAccount:not_found
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
   * Update the balance of a BankAccount.
   * @param {Request} req
   * 
   * @openapi
   * @action adminUpdateBalance
   * @description Get the BankAccount informations
   * @templateParam {string} accountId The id of the BankAccount.
   * @bodyParam {number} balance The new BankAccount balance.
   * @successField {number:0} balance The balance of the BankAccount.
   * @error api:bankAccount:not_found
   */
  async adminUpdateBalance (req) {
    const accountId = req.getString('accountId');
    const balance = req.getBodyNumber('balance');

    const bankAccount = await this.backend.ask('core:bankAccount:setBalance', accountId, balance);

    if (bankAccount === null) {
      error.throwError('api:bankAccount:not_found');
    }

    return bankAccount.balance;
  }

  /**
   * Create a new BankAccount
   * 
   * @param {Request} req
   * 
   * @openapi
   * @action adminCreateAccount
   * @description Create a new BankAccount
   * @bodyParam {number:0} balance The balance of the BankAccount.
   * @successField {number:0} balance The balance of the BankAccount.
   * @successField {string:"cc371db2-8f9a-4f28-bb4d-2220906b371e"} id The BankAccount id.
   * @successField {string:"6666"} vcc The BankAccount visual cryptographic code.
   * @error api:bankAccount:creation_failed
   */
  async adminCreateAccount (req) {
    const balance = req.getBodyNumber('balance', 0);
    const account = await this.backend.ask('core:bankAccount:create', balance);

    if (!account) {
      error.throwError('api:bankAccount:creation_failed');
    }

    return account;
  }

  /**
   * Delete a BankAccount
   * @param {Request} req 
   * 
   * @openapi
   * @action adminDeleteAccount
   * @description Delete a BankAccount
   * @templateParam {string:"cc371db2-8f9a-4f28-bb4d-2220906b371e"} accountId The BankAccount ID.
   * @return {boolean} true
   */
  async adminDeleteAccount (req) {
    const accountId = req.getString('accountId');
    await this.backend.ask('core:bankAccount:delete', accountId);
    return true;
  }
}

module.exports = BankAccountController;