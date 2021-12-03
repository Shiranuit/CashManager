'use strict';

const BackendStateEnum = Object.freeze({
  STARTING: 1,
  RUNNING: 2,
  SHUTTING_DOWN: 3,
});

module.exports = BackendStateEnum;