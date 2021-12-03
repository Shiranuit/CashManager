'use strict';

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
  }

  /**
   * Get the bankAccount from the DB given a user id
   *
   * @param {integer} userId
   * @returns {Promise<{
   *  id: integer,
   *  user_id: integer,
   *  balance: integer,
   * }>}
   */
  async getAccount (userId) {
    const result = await this.backend.ask(
      'postgres:query',
      'SELECT id, user_id, balance FROM bank_accounts WHERE user_id = $1;',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Create a bankAccount inside the DB given a user id
   *
   * @param {integer} userId
   * @param {integer} balance (optional) [default: 0]
   * @returns {Promise<{
   *  id: integer,
   *  user_id: integer,
   *  balance: integer,
   * }>}
   */
  async createAccount (userId, balance = 0) {
    const result = await this.backend.ask(
      'postgres:query',
      'INSERT INTO bank_accounts (user_id, balance) VALUES ($1, $2) RETURNING id, user_id, balance;',
      [userId, balance]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Update the account balance from the DB given a user id
   *
   * @param {integer} userId
   * @param {integer} balance (optional) [default: 0]
   * @param {{status: boolean, start: Date}} data
   * @returns {Promise<{
   *  id: integer,
   *  user_id: integer,
   *  balance: integer,
   * }>}
   */
  async setAccountBalance (userId, balance = 0) {
    const result = await this.backend.ask(
      'postgres:query',
      'UPDATE clocks SET balance = $2 WHERE user_id = $1 RETURNING id, user_id, balance;',
      [userId, balance]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Delete a bankAccount from the DB given a user id
   *
   * @param {integer} userId
   * @returns {void}
   */
  async deleteAccount (userId) {
    await this.backend.ask(
      'postgres:query',
      'DELETE FROM bank_accounts WHERE user_id = $1;',
      [userId]
    );
  }
}

module.exports = BankAccountRepository;