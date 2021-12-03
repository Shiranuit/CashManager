'use strict';

const jwt = require('jsonwebtoken');
const Token = require('../../model/token');
const error = require('../../errors');

class TokenRepository {
  constructor () {
    this.backend = null;
    this.config = {};
    this.tokens = new Map();
  }

  /**
   * Initialize the repository
   * @param {Backend} backend
   */
  async init (backend) {
    this.backend = backend;
    this.config = backend.config.auth.jwt;

    /**
     * Register all the askable methods
     */
    backend.onAsk('core:security:token:create', this.generateToken.bind(this));
    backend.onAsk('core:security:token:delete', this.expire.bind(this));
    backend.onAsk('core:security:token:verify', this.verify.bind(this));
  }

  async generateToken (user, options) {
    const encodedJwt = jwt.sign({id: user.id}, this.config.secret, options);

    const token = new Token({
      id: `${user.id}#${encodedJwt}`,
      userId: user.id,
      jwt: encodedJwt,
      ttl: options.expiresIn,
      expiresAt: Date.now() + options.expiresIn
    });

    this.tokens.set(token.id, token);
    return token;
  }

  async expire (encodedJwt) {
    try {
      const decoded = jwt.verify(encodedJwt, this.config.secret);
      const hash = `${decoded.id}#${encodedJwt}`;

      if (this.tokens.has(hash)) {
        this.tokens.delete(hash);
      }
    } catch (e) {
      // Do nothing, not a big deal
    }
  }

  async verify (encodedJwt) {
    if (!encodedJwt) {
      return null;
    }

    let decoded;
    try {
      decoded = jwt.verify(encodedJwt, this.config.secret);
    } catch (e) {
      // Might be a forged token, reject
      error.throwError('security:token:invalid');
    }

    const hash = `${decoded.id}#${encodedJwt}`;

    if (this.tokens.has(hash)) {
      const token = this.tokens.get(hash);

      if (token.expiresAt > Date.now()) {
        return token;
      }

      this.tokens.delete(hash);
      error.throwError('security:token:expired');
    }

    error.throwError('security:token:invalid');
  }

}

module.exports = TokenRepository;