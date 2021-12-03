const sinon = require('sinon');

class RateLimiterMock {
  constructor() {
    this.isAllowed = sinon.stub();
    this.init = sinon.stub();
  }
}

module.exports = RateLimiterMock;