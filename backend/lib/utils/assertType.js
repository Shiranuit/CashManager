'use strict';

const BadRequestError = require('../errors/badRequestError');

function assertString (attr, data) {
  if (data === null || data === undefined) {
    return null;
  }

  if (typeof data !== 'string') {
    throw new BadRequestError(`Attribute ${attr} must be of type "string"`);
  }

  return data;
}

function assertInteger (attr, data) {
  if (!Number.isInteger(data)) {
    throw new BadRequestError(`Attribute ${attr} must be an integer`);
  }

  return data;
}

function assertObject (attr, data) {
  if (data === null || data === undefined) {
    return null;
  }

  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new BadRequestError(`Attribute ${attr} must be of type "object"`);
  }

  return data;
}

function assertArray (attr, data, type) {
  if (data === null || data === undefined) {
    return [];
  }

  if (!Array.isArray(data)) {
    throw new BadRequestError(`Attribute ${attr} must be of type "array"`);
  }

  const clone = [];

  for (const d of data) {
    if (d !== undefined && d !== null) {
      if (typeof d !== type) {
        throw new BadRequestError(`Attribute ${attr} must contain only values of type "${type}"`);
      }

      clone.push(d);
    }
  }

  return clone;
}

module.exports = {
  assertArray,
  assertInteger,
  assertObject,
  assertString,
};