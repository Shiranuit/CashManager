'use strict';

class Token {
  constructor (data) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.jwt = data.jwt || null;
    this.ttl = data.ttl || null ;
    this.expiresAt = data.expiresAt || null;
    this.refreshed = false;
  }

  toJSON () {
    return {
      id: this.userId,
      userId: this.userId,
      jwt: this.jwt,
      ttl: this.ttl,
      expiresAt: this.expiresAt,
      refreshed: this.refreshed
    };
  }
}

module.exports = Token;