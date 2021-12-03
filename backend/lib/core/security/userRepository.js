'use strict';

const User = require('../../model/user');

class UserRepository {
  constructor () {
    this.backend = null;
    this.config = null;
  }

  /**
   * Initialize the repository
   * @param {Backend} backend
   */
  async init (backend) {
    this.backend = backend;
    this.config = backend.config.security;

    /**
     * Register all the askable methods
     */
    backend.onAsk('core:security:user:create', this.registerUser.bind(this));
    backend.onAsk('core:security:user:verify', this.verify.bind(this));
    backend.onAsk('core:security:user:verifyById', this.verifyById.bind(this));
    backend.onAsk('core:security:user:get', this.getUser.bind(this));
    backend.onAsk('core:security:user:update', this.updateUser.bind(this));
    backend.onAsk('core:security:user:updatePassword', this.updateUserPassword.bind(this));
    backend.onAsk('core:security:user:list', this.listUsers.bind(this));
    backend.onAsk('core:security:user:delete', this.deleteUser.bind(this));

    await this.createFirstAdmin();
  }

  async createFirstAdmin() {
    if (!this.config.firstAdmin) {
      // No first admin to create
      return;
    }

    const response = await this.backend.ask('postgres:query', 'SELECT firstTime FROM backend_state;');

    if (response.rows.length > 0 && response.rows[0].firsttime) {
      return;
    }

    await this.backend.ask(
      'core:security:user:create',
      {
        email: this.config.firstAdmin.email,
        username: this.config.firstAdmin.username,
        password: this.config.firstAdmin.password,
        role: this.config.firstAdmin.role,
      }
    );

    await this.backend.ask('postgres:query', 'INSERT INTO backend_state (firstTime) VALUES ($1)', [true]);
    this.backend.logger.debug('Create first admin');
  }

  async registerUser (data) {
    const hashedPassword = await this.backend.ask('core:security:vault:hash', data.password);

    const result = await this.backend.ask(
      'postgres:query',
      'INSERT INTO users (email, username, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role;',
      [data.email, data.username, hashedPassword, data.role || 'user']
    );

    return {
      username: result.rows[0].username,
      email: result.rows[0].email,
      role: result.rows[0].role,
      id: result.rows[0].id,
    };
  }

  async verify (data) {
    const hashedPassword = await this.backend.ask('core:security:vault:hash', data.password);

    const result = await this.backend.ask(
      'postgres:query',
      'SELECT id, password FROM users WHERE username = $1;',
      [data.username]
    );

    if (result.rows.length === 0) {
      return null;
    }

    if (await this.backend.ask('core:security:vault:verify', hashedPassword, result.rows[0].password)) {
      return new User(result.rows[0].id);
    }

    return null;
  }

  async verifyById (data) {
    const hashedPassword = await this.backend.ask('core:security:vault:hash', data.password);

    const result = await this.backend.ask(
      'postgres:query',
      'SELECT id, password FROM users WHERE id = $1;',
      [data.id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    if (await this.backend.ask('core:security:vault:verify', hashedPassword, result.rows[0].password)) {
      return new User(result.rows[0].id);
    }

    return null;
  }

  async getUser (id) {
    const result = await this.backend.ask(
      'postgres:query',
      'SELECT id, username, email, role FROM users WHERE id = $1;',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      username: result.rows[0].username,
      email: result.rows[0].email,
      role: result.rows[0].role,
      id
    };
  }

  async updateUser (id, data) {
    const result = await this.backend.ask(
      'postgres:query',
      'UPDATE users SET username = $2, email = $3, role = $4 WHERE id = $1 RETURNING id, username, email, role;',
      [id, data.username, data.email, data.role]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      username: result.rows[0].username,
      email: result.rows[0].email,
      id: result.rows[0].id,
      role: result.rows[0].role,
    };
  }

  async updateUserPassword (id, password) {

    const hashedPassword = await this.backend.ask('core:security:vault:hash', password);

    const result = await this.backend.ask(
      'postgres:query',
      'UPDATE users SET password = $2 WHERE id = $1 RETURNING id, username, email, role;',
      [id, hashedPassword]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      username: result.rows[0].username,
      email: result.rows[0].email,
      id: result.rows[0].id,
      role: result.rows[0].role,
    };
  }


  async listUsers () {
    const result = await this.backend.ask(
      'postgres:query',
      'SELECT id, email, username, role FROM users;',
    );

    return result.rows || [];
  }

  async deleteUser (id) {
    await this.backend.ask(
      'postgres:query',
      'DELETE FROM users WHERE id = $1;',
      [id]
    );
  }
}

module.exports = UserRepository;