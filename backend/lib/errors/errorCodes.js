'use strict';

const InternalError = require('./internalError');
const BadRequestError = require('./badRequestError');
const ServiceUnavailableError = require('./serviceUnavailableError');
const SecurityError = require('./securityError');

module.exports = {
  'request:origin:unauthorized': {
    message: 'Unauthorized origin "%s"',
    type: SecurityError,
  },
  'request:discarded:shutdown': {
    message: 'Backend is shutting down',
    type: ServiceUnavailableError,
  },
  'request:invalid:body': {
    message: 'Invalid request body',
    type: BadRequestError,
  },
  'request:invalid:missing_argument': {
    message: 'Missing argument "%s"',
    type: BadRequestError,
  },
  'request:invalid:invalid_type': {
    message: 'Wrong type for argument "%s" (expected: %s)',
    type: BadRequestError,
  },
  'request:invalid:email_format': {
    message: 'Invalid email format',
    type: BadRequestError,
  },
  'request:rate:limit_exceeded': {
    message: 'Rate limit exceeded for action %s:%s',
    type: SecurityError,
  },
  'network:http:duplicate_url': {
    message: 'Duplicate URL: "%s"',
    type: InternalError,
  },
  'network:http:url_not_found': {
    message: 'URL not found: "%s"',
    type: BadRequestError,
  },
  'security:user:invalid_role': {
    message: 'Invalid role "%s", expected %s',
    type: BadRequestError,
  },
  'security:user:creation_failed': {
    message: 'Failed to create user account',
    type: SecurityError,
  },
  'security:user:update_failed': {
    message: 'Failed to update user account informations',
    type: SecurityError,
  },
  'security:user:username_taken': {
    message: 'Username already taken',
    type: SecurityError,
  },
  'security:user:email_taken': {
    message: 'Email already taken',
    type: SecurityError,
  },
  'security:user:not_found': {
    message: 'User "%s" not found',
    type: SecurityError,
  },
  'security:user:with_id_not_found': {
    message: 'User with id "%s" not found',
    type: SecurityError,
  },
  'security:user:invalid_credentials': {
    message: 'Invalid Username or Password',
    type: SecurityError,
  },
  'security:user:password_too_short': {
    message: 'Password too short, should be at least %s characters',
    type: SecurityError,
  },
  'security:user:password_too_weak': {
    message: 'Password too weak, should include at least 1 Capital letter and 1 Number',
    type: SecurityError,
  },
  'security:user:username_too_short': {
    message: 'Username too short, should be at least %s characters',
    type: SecurityError,
  },
  'security:token:invalid': {
    message: 'Invalid token',
    type: SecurityError,
  },
  'security:token:creation_failed': {
    message: 'Failed to generate new token',
    type: SecurityError,
  },
  'security:token:expired': {
    message: 'Token expired',
    type: SecurityError,
  },
  'security:user:not_authenticated': {
    message: 'User not authenticated',
    type: SecurityError,
  },
  'security:permission:denied': {
    message: 'User does not have the required permissions to execute "%s:%s"',
    type: SecurityError,
  },
};