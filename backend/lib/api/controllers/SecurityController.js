'use strict';

const BaseController = require('./BaseController');
const error = require('../../errors');

const EMAIL_PATTERN = /^[A-z0-9_-]+(\.[A-z0-9_-]+)*@[A-z0-9_-]+(\.[A-z0-9_-]+)*\.[A-z0-9_-]+$/;
const CAPITAL_PATTERN = /[A-Z]/;
const NUMBER_PATTERN = /[0-9]/;
const LOWER_PATTERN = /[a-z]/;

class SecurityController extends BaseController {
  constructor () {
    super([
      { verb: 'get', path: '/_list', action: 'listUsers' },
      { verb: 'get', path: '/_list/_soft', action: 'listUsernames' },
      { verb: 'get', path: '/:userId', action: 'getUser' },
      { verb: 'post', path: '/', action: 'createUser' },
      { verb: 'put', path: '/:userId', action: 'updateUser' },
      { verb: 'put', path: '/:userId/_password', action: 'updateUserPassword' },
      { verb: 'delete', path: '/:userId', action: 'deleteUser' },
      { verb: 'put', path: '/:userId/_role', action: 'updateUserRole' },
      { verb: 'get', path: '/_roles', action: 'listRoles' },
    ]);
  }

  /**
   * Initialize the controller.
   * @param {Backend} backend
   */
  async init (backend) {
    super.init(backend);
    this.config = backend.config.auth;
    this.permissions = backend.config.permissions;
  }

  /**
   * List all the users.
   *
   * @returns {Promise<Array<User>>}
   * 
   * @openapi
   * @action listUsers
   * @description List all the existing users
   * @return {array} [[{"id":"number","username":"string","email":"string","role":"string"}]]
   */
  async listUsers() {
    return await this.backend.ask('core:security:user:list');
  }

  /**
   * List all the users names.
   *
   * @returns {Promise<Array<User>>}
   * 
   * @openapi
   * @action listUsernames
   * @description List the usernames and ids of all the users
   * @return {array} [[{"id":"number","username":"string"}]]
   */
  async listUsernames() {
    return (await this.backend.ask('core:security:user:list')).map(user => {
      return {
        id: user.id,
        username: user.username,
      };
    });
  }

  /**
   * List all roles.
   *
   * @returns {Promise<Array<string>>}
   * 
   * @openapi
   * @action listRoles
   * @description List all the existing roles
   * @return {array} [["roleName1", "roleName2", "..."]]
   */
  async listRoles() {
    return Object.keys(this.permissions).filter(_role => _role !== 'anonymous');
  }

  /**
   * Get user informations for a given user.
   *
   * @param {Request} req
   * @returns {Promise<User>}
   * 
   * @openapi
   * @action getUser
   * @description Retrieve the information of a given user
   * @templateParam {number} userId The id of the user
   * @successField {number:1} id The id of the user
   * @successField {string:"email@gmail.com"} username The username of the user
   * @successField {string:"username"} email The email of the user
   * @successField {string:"user"} role The role of the user
   * @error security:user:with_id_not_found
   */
  async getUser(req) {
    const userId = req.getInteger('userId');

    const user = await this.backend.ask('core:security:user:get', userId);

    if (!user) {
      error.throwError('security:user:with_id_not_found', userId);
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Create a user.
   *
   * @param {Request} req
   * @returns {Promise<User>}
   * 
   * @openapi
   * @action createUser
   * @description Create a new user
   * @bodyParam {string:"username"} username The username of the user
   * @bodyParam {string:"email@gmail.com"} email The email of the user
   * @bodyParam {string:"password"} password The password of the user
   * @bodyParam {string:"user"} role The role of the user
   * @successField {number:1} id The id of the user
   * @successField {string:"email@gmail.com"} username The username of the user
   * @successField {string:"username"} email The email of the user
   * @successField {string:"user"} role The role of the user
   * @error request:invalid:email_format
   * @error security:user:username_too_short
   * @error security:user:password_too_short
   * @error security:user:password_too_weak
   * @error security:user:email_taken
   * @error security:user:username_taken
   * @error security:user:invalid_role
   * @error security:user:creation_failed
   */
  async createUser(req) {
    const username = req.getBodyString('username');
    const email = req.getBodyString('email');
    const role = req.getBodyString('role', 'user');
    const password = req.getBodyString('password');

    if (!EMAIL_PATTERN.test(email)) {
      error.throwError('request:invalid:email_format');
    }

    if (username.length < this.config.username.minLength) {
      error.throwError('security:user:username_too_short', this.config.username.minLength);
    }

    if (password.length < this.config.password.minLength) {
      error.throwError('security:user:password_too_short', this.config.password.minLength);
    }

    if (!this._validatePasswordStrength(password)) {
      error.throwError('security:user:password_too_weak');
    }

    if (!this.permissions[role] || role === 'anonymous') {
      const roles = Object.keys(this.permissions).filter(_role => _role !== 'anonymous');
      error.throwError('security:user:invalid_role', role, `[${roles.join(', ')}]`);
    }

    try {
      const user = await this.backend.ask('core:security:user:create', { username, email, password, role });

      if (!user) {
        error.throwError('security:user:creation_failed');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
    } catch (err) {
      if (err.code) {
        if (err.code === '23505') {
          if (err.constraint === 'unique_username') {
            error.throwError('security:user:username_taken');
          } else if (err.constraint === 'unique_email') {
            error.throwError('security:user:email_taken');
          }
        }
      }
      throw err;
    }
  }

  /**
   * Update user informations for a given user.
   *
   * @param {Request} req
   * @returns {Promise<User>}
   * 
   * @openapi
   * @action updateUser
   * @description Update the informations of a given user
   * @templateParam {number} userId The id of the user
   * @bodyParam {string:"username"} username The new user username
   * @bodyParam {string:"email@gmail.com"} email The new user email
   * @successField {number:1} id The id of the user
   * @successField {string:"email@gmail.com"} username The username of the user
   * @successField {string:"username"} email The email of the user
   * @successField {string:"user"} role The role of the user
   * @error security:user:with_id_not_found
   * @error request:invalid:email_format
   * @error security:user:username_too_short
   * @error security:user:email_taken
   * @error security:user:username_taken
   * @error security:user:update_failed
   */
  async updateUser(req) {
    const userId = req.getInteger('userId');

    const userInfos = await this.backend.ask('core:security:user:get', userId);

    if (!userInfos) {
      error.throwError('security:user:with_id_not_found', userId);
    }

    const body = req.getBody();

    if (body.email) {
      if (!EMAIL_PATTERN.test(body.email)) {
        error.throwError('request:invalid:email_format');
      }
    }

    if (body.username) {
      if (body.username.length < this.config.username.minLength) {
        error.throwError('security:user:username_too_short', this.config.username.minLength);
      }
    }

    const sanitizeBody = JSON.parse(JSON.stringify({
      email: body.email,
      username: body.username,
    }));

    try {
      const user = await this.backend.ask('core:security:user:update', userId, {...userInfos, ...sanitizeBody});

      if (!user) {
        error.throwError('security:user:update_failed');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
    } catch (err) {
      if (err.code) {
        if (err.code === '23505') {
          if (err.constraint === 'unique_username') {
            error.throwError('security:user:username_taken');
          } else if (err.constraint === 'unique_email') {
            error.throwError('security:user:email_taken');
          }
        }
      }
      throw err;
    }
  }

  /**
   * Change the password for a given user
   *
   * @param {Request} req
   * @returns {Promise<User>}
   * 
   * @openapi
   * @action updateUserPassword
   * @description Update the password of a given user
   * @templateParam {number} userId The id of the user
   * @bodyParam {string:"password"} password The new user password
   * @successField {number:1} id The id of the user
   * @successField {string:"email@gmail.com"} username The username of the user
   * @successField {string:"username"} email The email of the user
   * @successField {string:"user"} role The role of the user
   * @error security:user:with_id_not_found
   * @error security:user:password_too_short
   * @error security:user:password_too_weak
   * @error security:user:update_failed
   */
  async updateUserPassword (req) {
    const userId = req.getInteger('userId');

    const newPassword = req.getBodyString('newPassword');

    const userInfos = await this.backend.ask('core:security:user:get', userId);

    if (!userInfos) {
      error.throwError('security:user:with_id_not_found', userId);
    }

    if (newPassword.length < this.config.password.minLength) {
      error.throwError('security:user:password_too_short', this.config.password.minLength);
    }

    if (!this._validatePasswordStrength(newPassword)) {
      error.throwError('security:user:password_too_weak');
    }

    const user = await this.backend.ask('core:security:user:updatePassword', userId, newPassword);

    if (!user) {
      error.throwError('security:user:update_failed');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Update the role of a given user.
   *
   * @param {Request} req
   * @returns {Promise<User>}
   * 
   * @openapi
   * @action updateUserRole
   * @description Update the role of a given user
   * @templateParam {number} userId The id of the user
   * @bodyParam {string:"user"} role The new user role
   * @successField {number:1} id The id of the user
   * @successField {string:"email@gmail.com"} username The username of the user
   * @successField {string:"username"} email The email of the user
   * @successField {string:"user"} role The role of the user
   * @error security:user:with_id_not_found
   * @error security:user:invalid_role
   * @error security:user:update_failed
   */
  async updateUserRole(req) {
    const userId = req.getInteger('userId');

    const userInfos = await this.backend.ask('core:security:user:get', userId);

    if (!userInfos) {
      error.throwError('security:user:with_id_not_found', userId);
    }

    const role = req.getBodyString('role');

    if (!this.permissions[role] || role === 'anonymous') {
      const roles = Object.keys(this.permissions).filter(_role => _role !== 'anonymous');
      error.throwError('security:user:invalid_role', role, `[${roles.join(', ')}]`);
    }

    const sanitizeBody = JSON.parse(JSON.stringify({
      role,
    }));

    const user = await this.backend.ask('core:security:user:update', userId, {...userInfos, ...sanitizeBody});

    if (!user) {
      error.throwError('security:user:update_failed');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Delete a given user
   *
   * @param {Request} req
   * @returns {Promise<boolean>}
   * 
   * @openapi
   * @action deleteUser
   * @description Delete a given user
   * @templateParam {number} userId The id of the user
   * @return {boolean:} true
   */
  async deleteUser(req) {
    const userId = req.getInteger('userId');

    await this.backend.ask('core:security:user:delete', userId);

    return true;
  }

  /**
   * Verifies that the password is strong enough
   * 
   * @param {string} password 
   * @returns 
   */
  _validatePasswordStrength(password) {
    return CAPITAL_PATTERN.test(password)
      && LOWER_PATTERN.test(password)
      && NUMBER_PATTERN.test(password);
  }

}

module.exports = SecurityController;