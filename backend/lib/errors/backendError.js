'use strict';

class BackendError extends Error {
  constructor (status, id, message, type='BackendError') {
    super(message);
    this.id = id;
    this.status = status || 0;
    this.type = type;
  }

  toJSON () {
    return {
      id: this.id,
      status: this.status,
      message: this.message,
      stack: this.stack,
      type: this.type
    };
  }
}

module.exports = BackendError;