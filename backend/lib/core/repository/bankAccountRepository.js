'use strict';

const uuid = require('uuid').v4;
const crypto = require('crypto');

class BankAccountRepository {
  constructor () {
    this.backend = null;
  }

  /**
   * Initialize the repository
   * @param {Backend} backend
   */
  async init (backend) {
    this.backend = backend;

    /**
     * Register all the askable methods
     */
    backend.onAsk('core:bankAccount:get', this.getAccount.bind(this));
    backend.onAsk('core:bankAccount:setBalance', this.setAccountBalance.bind(this));
    backend.onAsk('core:bankAccount:create', this.createAccount.bind(this));
    backend.onAsk('core:bankAccount:delete', this.deleteAccount.bind(this));
    backend.onAsk('core:bankAccount:verify', this.verifyAccount.bind(this));
  }

  /**
   * Get the bankAccount from the DB given a account id
   *
   * @param {string} accountId
   * @returns {Promise<{
   *  id: integer,
   *  user_id: integer,
   *  balance: integer,
   * }>}
   */
  async getAccount (accountId) {
    const result = await this.backend.ask(
      'postgres:query',
      'SELECT id, vcc, balance FROM bank_accounts WHERE id = $1;',
      [accountId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Create a bankAccount inside the DB given a account id
   *
   * @param {string} accountId
   * @param {integer} balance (optional) [default: 0]
   * @returns {Promise<{
   *  id: integer,
   *  user_id: integer,
   *  balance: integer,
   * }>}
   */
  async createAccount (balance = 0) {
    const vcc = crypto.randomInt(10000).toString().padStart(4, '0');
    const result = await this.backend.ask(
      'postgres:query',
      'INSERT INTO bank_accounts (id, vcc, balance) VALUES ($1, $2, $3) RETURNING id, vcc, balance;',
      [uuid(), vcc, balance]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Update the account balance from the DB given a account id
   *
   * @param {string} accountId
   * @param {integer} balance (optional) [default: 0]
   * @param {{status: boolean, start: Date}} data
   * @returns {Promise<{
   *  id: integer,
   *  user_id: integer,
   *  balance: integer,
   * }>}
   */
  async setAccountBalance (accountId, balance = 0) {
    const result = await this.backend.ask(
      'postgres:query',
      'UPDATE bank_accounts SET balance = $2 WHERE id = $1 RETURNING id, vcc, balance;',
      [accountId, balance]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Delete a bankAccount from the DB given a account id
   *
   * @param {string} accountId
   */
  async deleteAccount (accountId) {
    await this.backend.ask(
      'postgres:query',
      'DELETE FROM bank_accounts WHERE id = $1;',
      [accountId]
    );
  }

  /**
   * Verify bankAccount informations
   * 
   * @param {string} accountId 
   * @param {string} vcc 
   */
  async verifyAccount (accountId, vcc) {
    const account = await this.backend.ask(
      'postgres:query',
      'SELECT balance FROM bank_accounts WHERE id = $1 AND vcc = $2;',
      [accountId, vcc]
    );

    if (account.rows.length === 0) {
      return false;
    }
    return true;
  }
}

module.exports = BankAccountRepository;