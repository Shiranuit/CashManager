const sinon = require('sinon');

class RouterMock {
  constructor() {
    this.attach = sinon.stub();
    this.find = sinon.stub();
  }
}

module.exports = RouterMock;