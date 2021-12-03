'use strict';

function has (o, prop) {
  return Object.prototype.hasOwnProperty.call(o, prop);
}

function get (o, prop) {
  if (has(o, prop)) {
    return o[prop];
  }

  return undefined;
}

function isPlainObject (o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

module.exports = { get, has, isPlainObject };