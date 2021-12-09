'use strict';

const BaseController = require('./BaseController');
const error = require('../../errors');

class BalanceController extends BaseController {
  constructor () {
    super([
      { verb: 'get', path: '/', action: 'getBalance' },
      { verb: 'post', path: '/', action: 'updateBalance' },

      { verb: 'get', path: '/_me', action: 'getMyBalance'},
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
   * Get the balance of a user.
   * @param {number} userId
   * @returns {Promise<number>}
   */
  async _getBalance (userId) {
    const user = await this.backend.ask('core:security:user:get', userId);

    if (!user) {
      error.throwError('security:user:with_id_not_found', userId);
    }

    const balance = await this.backend.ask('core:balance:get', userId);

    if (balance === null) {
      
    }

    return balance.money;
  }

  /**
   * Get the balance of a user.
   * @param {Request} request
   */
  async getBalance (req) {

  }

  /**
   * Get the balance of the current user.
   * @param {Request} req
   */
  async getMyBalance (req) {
    if (req.isAnonymous()) {
      error.throwError('security:user:not_authenticated');
    }
  }

  /**
   * Update the balance of a user.
   * @param {Request} req
   */
  async updateBalance (req) {

  }
}

module.exports = BalanceController;