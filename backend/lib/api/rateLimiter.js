'use strict';

class RateLimiter {
  constructor() {
    this.rateLimits = {};
    this.connectionLimits = new Map();
  }
  
  async init(backend) {
    this.rateLimits = backend.config.rateLimits;
    setInterval(this.resetLimits.bind(this), 60 * 1000); // reset every minute
  }

  async isAllowed(req) {
    if ( !this.rateLimits[req.getController()]
      || !this.rateLimits[req.getController()][req.getAction()]
    ) {
      return true;
    }

    const limit = this.rateLimits[req.getController()][req.getAction()];

    const socket = req.input.request.socket;
    const ipAddress = socket.remoteAddress;
    const action = `${req.getController()}:${req.getAction()}`;
    if (!this.connectionLimits.has(ipAddress)) {
      this.connectionLimits.set(ipAddress, {
        [action]: 1,
      });
      return true;
    }

    const rates = this.connectionLimits.get(ipAddress);
    if (rates[action]) {
      const rate = rates[action];
      
      if (rate >= limit) {
        return false;
      }

      rates[action] = rate + 1;
      return true;
    }

    rates[action] = 1;
    return true;
  }

  async resetLimits() {
    this.connectionLimits.clear();
  }

}

module.exports = RateLimiter;