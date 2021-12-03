'use strict';

const BaseController = require('./BaseController');
const error = require('../../errors');

class BalanceController extends BaseController {
  constructor () {
    super([
      { verb: 'get', path: '/:userId', action: 'getBalance' },
      { verb: 'post', path: '/:userId', action: 'updateBalance' },

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

    const bankAccount = await this.backend.ask('core:bankAccount:get', userId);

    // Should never happens but just for safety
    if (bankAccount === null) {
      error.throwError('api:bankAccount:not_found');
    }

    return bankAccount.balance;
  }

  /**
   * Get the balance of a user.
   * @param {Request} request
   */
  async getBalance (req) {
    const userId = req.getInteger('userId');

    return await this._getBalance(userId);
  }

  /**
   * Get the balance of the current user.
   * @param {Request} req
   */
  async getMyBalance (req) {
    if (req.isAnonymous()) {
      error.throwError('security:user:not_authenticated');
    }

    return await this._getBalance(req.getUser().id);
  }

  /**
   * Update the balance of a user.
   * @param {Request} req
   */
  async updateBalance (req) {
    const userId = req.getInteger('userId');
    const money = req.getBodyInteger('money');

    const user = await this.backend.ask('core:security:user:get', userId);

    if (!user) {
      error.throwError('security:user:with_id_not_found', userId);
    }

    const bankAccount = await this.backend.ask('core:bankAccount:setBalance', userId, money);

    if (bankAccount === null) {
      error.throwError('api:bankAccount:not_found');
    }

    return bankAccount.balance;
  }
}

module.exports = BalanceController;