const sinon = require('sinon');
const RouterMock = require('./router.mock');

class BackendMock {
  constructor(config = {}) {
    this.onAsk = sinon.stub();
    this.ask = sinon.stub();
    this.start = sinon.stub();
    this.shutdown = sinon.stub();
    this.config = config;
    this.router = new RouterMock();
    this.logger = {
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub(),
      debug: sinon.stub(),
    };
  }
}

module.exports = BackendMock;