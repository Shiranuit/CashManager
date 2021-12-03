'use strict';

const should = require('should');
const sinon = require('sinon');
const { SecurityController } = require('../../../lib/api/controllers');
const BackendMock = require('../../mocks/backend.mock');
const Request = require('../../../lib/api/requests/request');
const SecurityError = require('../../../lib/errors/securityError');
const BadRequestError = require('../../../lib/errors/badRequestError');

describe('SecurityController', () => {
  let securityController;
  let backend;
  beforeEach(async () => {
    securityController = new SecurityController();
    backend = new BackendMock({
      auth: {
        username: {
          minLength: 3,
        },
        password: {
          minLength: 8,
        }
      },
      permissions: {
        'user': {}
      },
    });
    await securityController.init(backend);
  });

  describe('#init', () => {
    it('should copy backend config', async () => {
      securityController = new SecurityController();
      backend = new BackendMock({
        auth: { foo: 'bar' },
        permissions: { bar: 'baz' },
      });
      await securityController.init(backend);

      await should(securityController.config).match({ foo: 'bar' });
      await should(securityController.permissions).match({ bar: 'baz' });
    });
  });

  describe('#listUsers', () => {
    it('should ask core:security:user:list', async () => {
      await securityController.listUsers();
      await should(backend.ask).be.calledWith('core:security:user:list');
    });
  });

  describe('#listRoles', () => {
    it('should the role list based on permissions config', async () => {
      securityController.permissions = {
        anonymous: {},
        foo: {},
        bar: {},
      };

      const roles = await securityController.listRoles();
      await should(roles).eql(['foo', 'bar']);
    });
  });

  describe('#getUser', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
      request.input.args = {
        userId: 42,
      };
    });

    it('should reject if user not found', async () => {
      backend.ask.withArgs('core:security:user:get').resolves(null);

      await should(securityController.getUser(request))
        .be.rejectedWith(
          SecurityError,
          { id: 'security:user:with_id_not_found' }
        );
    });

    it('should return user informations', async () => {
      backend.ask.withArgs('core:security:user:get').resolves({
        id: 42,
        username: 'foo',
        email: 'bar',
        role: 'baz',
      });

      const user = await securityController.getUser(request);

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
      await should(user).match({
        id: 42,
        username: 'foo',
        email: 'bar',
        role: 'baz',
      });
    });
  });

  describe('#createUser', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
      request.input.body = {
        'username': 'foo',
        'password': 'Password0',
        'email': 'foo@bar.baz',
      };
    });

    it('should reject if the email has an invalid format', async () => {
      request.input.body.email = 'baz';
      await should(securityController.createUser(request)).be.rejectedWith(
        BadRequestError,
        { id: 'request:invalid:email_format' }
      );
    });

    it('should reject if the username is too short', async () => {
      request.input.body.username = 'a';
      await should(securityController.createUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:username_too_short' }
      );
    });

    it('should reject if the password is too short', async () => {
      request.input.body.password = 'a';
      await should(securityController.createUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:password_too_short' }
      );
    });

    it('should reject if the password is too weak', async () => {
      securityController._validatePasswordStrength = sinon.stub().returns(false);
      await should(securityController.createUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:password_too_weak' }
      );
    });

    it('should reject if the role does not exists', async () => {
      request.input.body.role = 'foo';
      securityController._validatePasswordStrength = sinon.stub().returns(true);
      await should(securityController.createUser(request)).be.rejectedWith(
        BadRequestError,
        { id: 'security:user:invalid_role' }
      );
    });

    it('should reject if cannot create the user', async () => {
      backend.ask.withArgs('core:security:user:create').resolves(null);
      await should(securityController.createUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:creation_failed' }
      );
    });
    
    it('should reject with security:user:username_taken if a user with the same username already exists', async () => {
      backend.ask.withArgs('core:security:user:create')
        .rejects({code: '23505', constraint: 'unique_username'});
      await should(securityController.createUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:username_taken' }
      );
    });

    it('should reject with security:user:email_taken if a user with the same email already exists', async () => {
      backend.ask.withArgs('core:security:user:create')
        .rejects({code: '23505', constraint: 'unique_email'});
      await should(securityController.createUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:email_taken' }
      );
    });

    it('should return user informations when succesfuly registered', async () => {

      backend.ask.withArgs('core:security:user:create').resolves({
        id: 1,
        username: 'foo',
        email: 'foo@bar.baz',
      });

      const response = await securityController.createUser(request);

      await should(backend.ask).be.calledWith(
        'core:security:user:create',
        {
          username: 'foo',
          password: 'Password0',
          email: 'foo@bar.baz',
          role: 'user',
        }
      );

      await should(response).be.an.Object()
        .match({
          id: 1,
          username: 'foo',
          email: 'foo@bar.baz',
        });
    });
  });

  describe('#updateUser', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
      request.input.args = { userId: 42 };
      request.input.body = {
        actualPassword: 'password',
        username: 'USERNAME',
        email: 'EMAIL@EMAIL.COM',
        role: 'ROLE',
      };
    });

    it('should reject if the current user is not found', async () => {
      backend.ask.withArgs('core:security:user:get').resolves(null);
      await should(securityController.updateUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:with_id_not_found' }
      );
    });

    it('should reject if the email has not a valid format', async () => {
      request.input.body.email = 'invalidEmail';
      backend.ask.withArgs('core:security:user:get')
        .resolves({
          id: 42,
          username: 'foo',
          email: 'bar',
          role: 'user'
        });

      await should(securityController.updateUser(request)).be.rejectedWith(
        BadRequestError,
        { id: 'request:invalid:email_format' }
      );

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
    });

    it('should reject if the username is too short', async () => {
      request.input.body.username = 'u'; // Short username
      backend.ask.withArgs('core:security:user:get')
        .resolves({
          id: 42,
          username: 'foo',
          email: 'bar',
          role: 'user'
        });

      await should(securityController.updateUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:username_too_short' }
      );

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
    });

    it('should update the user informations', async () => {
      backend.ask.withArgs('core:security:user:get')
        .resolves({
          id: 42,
          username: 'foo',
          email: 'bar',
          role: 'user'
        });

      backend.ask.withArgs('core:security:user:update')
        .resolves({
          id: 42,
          username: 'USERNAME',
          email: 'EMAIL@EMAIL.COM',
          role: 'user',
        });

      const response = await securityController.updateUser(request);

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
      await should(backend.ask).be.calledWith(
        'core:security:user:update',
        42,
        {
          id: 42,
          username: 'USERNAME',
          email: 'EMAIL@EMAIL.COM',
          role: 'user',
        }
      );

      await should(response)
        .be.an.Object()
        .match({
          id: 42,
          username: 'USERNAME',
          email: 'EMAIL@EMAIL.COM',
          role: 'user',
        });
    });

    it('should reject if cannot update user informations', async () => {
      backend.ask.withArgs('core:security:user:get')
        .resolves({
          id: 42,
          username: 'foo',
          email: 'bar',
          role: 'user'
        });

      backend.ask.withArgs('core:security:user:update')
        .resolves(null);

      await should(securityController.updateUser(request))
        .be.rejectedWith(
          SecurityError,
          { id: 'security:user:update_failed' }
        );

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
      await should(backend.ask).be.calledWith(
        'core:security:user:update',
        42,
        {
          id: 42,
          username: 'USERNAME',
          email: 'EMAIL@EMAIL.COM',
          role: 'user',
        }
      );
    });

    it('should reject if username is already taken', async () => {
      backend.ask.withArgs('core:security:user:get')
        .resolves({
          id: 42,
          username: 'foo',
          email: 'bar',
          role: 'user'
        });

      backend.ask.withArgs('core:security:user:update')
        .rejects({
          code: '23505',
          constraint: 'unique_username',
        });

      await should(securityController.updateUser(request))
        .be.rejectedWith(
          SecurityError,
          { id: 'security:user:username_taken' }
        );

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
      await should(backend.ask).be.calledWith(
        'core:security:user:update',
        42,
        {
          id: 42,
          username: 'USERNAME',
          email: 'EMAIL@EMAIL.COM',
          role: 'user',
        }
      );
    });

    it('should reject if email is already taken', async () => {
      backend.ask.withArgs('core:security:user:get')
        .resolves({
          id: 42,
          username: 'foo',
          email: 'bar',
          role: 'user'
        });

      backend.ask.withArgs('core:security:user:update')
        .rejects({
          code: '23505',
          constraint: 'unique_email',
        });

      await should(securityController.updateUser(request))
        .be.rejectedWith(
          SecurityError,
          { id: 'security:user:email_taken' }
        );

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
      await should(backend.ask).be.calledWith(
        'core:security:user:update',
        42,
        {
          id: 42,
          username: 'USERNAME',
          email: 'EMAIL@EMAIL.COM',
          role: 'user',
        }
      );
    });
  });

  describe('#updateUserPassword', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
      request.input.args = { userId: 42 };
      request.input.body = {
        oldPassword: 'foo',
        newPassword: 'bar',
      };
      backend.ask.withArgs('core:security:user:get').resolves({id: 42});
    });

    it('should reject if the user does not exists', async () => {
      backend.ask.withArgs('core:security:user:get').resolves(null);

      await should(securityController.updateUserPassword(request))
        .rejectedWith(
          SecurityError,
          { id: 'security:user:with_id_not_found' }
        );
    });

    it('should reject if the given password is too short', async () => {
      await should(securityController.updateUserPassword(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:password_too_short' }
      );
    });

    it('should reject if the given password is too weak', async () => {
      request.input.body.newPassword = 'foobarbaz';
      securityController._validatePasswordStrength = sinon.stub().returns(false);

      await should(securityController.updateUserPassword(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:password_too_weak' }
      );

      await should(securityController._validatePasswordStrength).be.calledWith('foobarbaz');
    });

    it('should user information if the update succeeded', async () => {
      request.input.body.newPassword = 'foobarbaz';
      securityController._validatePasswordStrength = sinon.stub().returns(true);
      backend.ask.withArgs('core:security:user:updatePassword')
        .resolves({
          id: 42,
          username: 'foo',
          email: 'bar',
          role: 'user'
        });

      const response = await securityController.updateUserPassword(request);

      await should(securityController._validatePasswordStrength).be.calledWith('foobarbaz');
      await should(backend.ask).be.calledWith('core:security:user:updatePassword', 42, 'foobarbaz');

      await should(response)
        .be.an.Object()
        .match({
          id: 42,
          username: 'foo',
          email: 'bar',
          role: 'user'
        });
    });

    it('should reject if update failed', async () => {
      request.input.body.newPassword = 'foobarbaz';
      securityController._validatePasswordStrength = sinon.stub().returns(true);
      backend.ask.withArgs('core:security:user:updatePassword')
        .resolves(null);

      await should(securityController.updateUserPassword(request))
        .be.rejectedWith(
          SecurityError,
          { id: 'security:user:update_failed' }
        );

      await should(securityController._validatePasswordStrength).be.calledWith('foobarbaz');
      await should(backend.ask).be.calledWith('core:security:user:updatePassword', 42, 'foobarbaz');
    });
  });

  describe('#updateUserRole', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
      request.input.args = { userId: 42 };
      request.input.body = {
        role: 'foo',
      };
      backend.ask.withArgs('core:security:user:get')
        .resolves({
          id: 42,
          username: 'name',
          email: 'email',
          role: 'user'
        });
      securityController.permissions = {
        anonymous: {},
        bar: {},
        foo: {},
      };
    });

    it('should reject if the user does not exists', async () => {
      backend.ask.withArgs('core:security:user:get').resolves(null);

      await should(securityController.updateUserRole(request))
        .rejectedWith(
          SecurityError,
          { id: 'security:user:with_id_not_found' }
        );
    });

    it('should reject if the role does not exist', async () => {
      request.input.body = {
        role: 'foo',
      };
      securityController.permissions = {
        anonymous: {},
        bar: {},
      };
      await should(securityController.updateUserRole(request))
        .rejectedWith(
          BadRequestError,
          { id: 'security:user:invalid_role' }
        );
    });

    it('should reject cannot update the user informations', async () => {
      backend.ask.withArgs('core:security:user:update').resolves(null);
      await should(securityController.updateUserRole(request))
        .rejectedWith(
          SecurityError,
          { id: 'security:user:update_failed' }
        );
    });

    it('should update the user role', async () => {
      backend.ask.withArgs('core:security:user:update').resolves({
        id: 42,
        username: 'name',
        email: 'email',
        role: 'foo',
      });

      const reponse = await securityController.updateUserRole(request);

      await should(backend.ask).be.calledWith('core:security:user:update', 42, {
        id: 42,
        username: 'name',
        email: 'email',
        role: 'foo',
      });

      await should(reponse)
        .be.an.Object()
        .match({
          id: 42,
          username: 'name',
          email: 'email',
          role: 'foo',
        });
    });
  });

  describe('#deleteUser', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
      request.input.args = {
        userId: 42,
      };
    });

    it('should ask core:security:user:delete', async () => {
      await securityController.deleteUser(request);

      await should(backend.ask).be.calledWith('core:security:user:delete', 42);
    });
  });
});