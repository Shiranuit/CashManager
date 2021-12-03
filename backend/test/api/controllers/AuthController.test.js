'use strict';

const should = require('should');
const sinon = require('sinon');
const { AuthController } = require('../../../lib/api/controllers');
const BackendMock = require('../../mocks/backend.mock');
const Request = require('../../../lib/api/requests/request');
const SecurityError = require('../../../lib/errors/securityError');
const BadRequestError = require('../../../lib/errors/badRequestError');

describe('AuthController', () => {

  let authController;
  let backend;
  beforeEach(async () => {
    authController = new AuthController();
    backend = new BackendMock({
      auth: {
        username: {
          minLength: 3,
        },
        password: {
          minLength: 8,
        }
      }
    });
    await authController.init(backend);
  });
  
  describe('#login', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
      request.input.body = {
        'username': 'foo',
        'password': 'bar',
      };

      backend.ask.resolves(null);
    });

    it('should reject when invalid credentials are given', async () => {
      
      await should(authController.login(request))
        .be.rejectedWith(SecurityError, {id: 'security:user:invalid_credentials'});

      await should(backend.ask).be.calledWith(
        'core:security:user:verify',
        {username: 'foo', password: 'bar'}
      );
    });

    it('should reject when not able to create token', async () => {
      backend.ask.withArgs(
        'core:security:user:verify',
        {username: 'foo', password: 'bar'}
      ).resolves({id: 1});


      await should(authController.login(request))
        .be.rejectedWith(SecurityError, {id: 'security:token:creation_failed'});

      await should(backend.ask).be.calledWith(
        'core:security:token:create',
        {id: 1},
        {expiresIn: 3600000}
      );
    });

    it('should return a token when successfuly logged in', async () => {
      backend.ask.withArgs(
        'core:security:user:verify',
        {username: 'foo', password: 'bar'}
      ).resolves({id: 1});

      backend.ask.withArgs(
        'core:security:token:create',
        {id: 1},
        {expiresIn: 3600000}
      ).resolves({
        userId: 1,
        jwt: 'foo',
        ttl: 42,
        expiresAt: 42,
      });

      const response = await authController.login(request);

      await should(response)
        .be.an.Object()
        .and.match({
          id: 1,
          jwt: 'foo',
          ttl: 42,
          expiresAt: 42,
        }
      );
    });
  });

  describe('#logout', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {
          authorization: 'token'
        },
        host: '',
      });

      backend.ask.resolves(null);
    });

    it('should delete the token', async () => {
      const response = await authController.logout(request);

      await should(backend.ask).be.calledWith(
        'core:security:token:delete',
        'token'
      );

      await should(response).be.true();
    });
  });

  describe('#register', () => {
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
      await should(authController.register(request)).be.rejectedWith(
        BadRequestError,
        { id: 'request:invalid:email_format' }
      );
    });

    it('should reject if the username is too short', async () => {
      request.input.body.username = 'a';
      await should(authController.register(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:username_too_short' }
      );
    });

    it('should reject if the password is too short', async () => {
      request.input.body.password = 'a';
      await should(authController.register(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:password_too_short' }
      );
    });

    it('should reject if the password is too weak', async () => {
      authController._validatePasswordStrength = sinon.stub().returns(false);
      await should(authController.register(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:password_too_weak' }
      );
    });


    it('should reject if cannot create the user', async () => {
      backend.ask.withArgs('core:security:user:create').resolves(null);
      await should(authController.register(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:creation_failed' }
      );
    });
    
    it('should reject with security:user:username_taken if a user with the same username already exists', async () => {
      backend.ask.withArgs('core:security:user:create')
        .rejects({code: '23505', constraint: 'unique_username'});
      await should(authController.register(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:username_taken' }
      );
    });

    it('should reject with security:user:email_taken if a user with the same email already exists', async () => {
      backend.ask.withArgs('core:security:user:create')
        .rejects({code: '23505', constraint: 'unique_email'});
      await should(authController.register(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:email_taken' }
      );
    });

    it('should return valid token when succesfuly registered', async () => {
      backend.ask.withArgs('core:security:user:create').resolves({
        id: 1,
      });

      backend.ask.withArgs('core:security:token:create').resolves({
        userId: 1,
        jwt: 'token',
        ttl: 42,
        expiresAt: 42,
      });

      const response = await authController.register(request);

      await should(backend.ask).be.calledWith(
        'core:security:user:create',
        {
          username: 'foo',
          password: 'Password0',
          email: 'foo@bar.baz'
        }
      );

      await should(backend.ask).be.calledWith(
        'core:security:token:create',
        { id: 1 },
        { expiresIn: 3600000 },
      );

      await should(response).be.an.Object()
        .match({
          id: 1,
          jwt: 'token',
          ttl: 42,
          expiresAt: 42,
        });
    });
  });

  describe('#checkToken', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
    });

    it('should return token information with a null id when verification fails', async () => {
      request.input.body = { jwt: 'token' };

      backend.ask.withArgs('core:security:token:verify').resolves(null);

      let response = await authController.checkToken(request);
      await should(response)
        .be.an.Object()
        .match({
          id: null,
          ttl: -1,
          expiresAt: -1,
        });

        backend.ask.withArgs('core:security:token:verify').rejects(new Error('Something went wrong'));

      response = await authController.checkToken(request);
      await should(response)
        .be.an.Object()
        .match({
          id: null,
          ttl: -1,
          expiresAt: -1,
        });
    });

    it('should return token information verification succeeded', async () => {
      request.input.body = { jwt: 'token' };

      backend.ask.withArgs('core:security:token:verify').resolves({
        userId: 1,
        ttl: 42,
        expiresAt: 42,
      });

      let response = await authController.checkToken(request);
      await should(response)
        .be.an.Object()
        .match({
          id: 1,
          ttl: 42,
          expiresAt: 42,
        });
    });
  });

  describe('#getMyUser', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
    });

    it('should reject if the user is not authenticated', async () => {
      await should(authController.getMyUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:not_authenticated' }
      );
    });

    it('should ask core:security:user:get with the current user id', async () => {
      request.context.user = { id: 1 };
      backend.ask.withArgs('core:security:user:get')
        .resolves({
          id: 1,
          username: 'foo',
          email: 'bar',
          role: 'user',
        });

      const response = await authController.getMyUser(request);

      await should(backend.ask).be.calledWith('core:security:user:get', 1);

      await should(response).be.an.Object()
        .match({
          id: 1,
          username: 'foo',
          email: 'bar',
          role: 'user',
        });
    });
  });

  describe('#updateMyUser', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
      request.context.user = { id: 42 };
      request.input.body = {
        actualPassword: 'password',
        username: 'USERNAME',
        email: 'EMAIL@EMAIL.COM',
        role: 'ROLE',
      };
    });

    it('should reject if the user is not authenticated', async () => {
      request.context.user = { id: null };
      await should(authController.updateMyUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:not_authenticated' }
      );
    });

    it('should reject if the current user is not found', async () => {
      backend.ask.withArgs('core:security:user:get').resolves(null);
      await should(authController.updateMyUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:with_id_not_found' }
      );
    });

    it('should reject if the given password does not match the user\'s password', async () => {
      backend.ask.withArgs('core:security:user:get')
        .resolves({
          id: 42,
          username: 'foo',
          email: 'bar',
          role: 'user'
        });

      backend.ask.withArgs('core:security:user:verifyById')
        .resolves(false);

      await should(authController.updateMyUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:invalid_credentials' }
      );

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
      await should(backend.ask).be.calledWith(
        'core:security:user:verifyById',
        {id: 42, password: 'password'},
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

      backend.ask.withArgs('core:security:user:verifyById')
        .resolves(true);

      await should(authController.updateMyUser(request)).be.rejectedWith(
        BadRequestError,
        { id: 'request:invalid:email_format' }
      );

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
      await should(backend.ask).be.calledWith(
        'core:security:user:verifyById',
        {id: 42, password: 'password'},
      );
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

      backend.ask.withArgs('core:security:user:verifyById')
        .resolves(true);

      await should(authController.updateMyUser(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:username_too_short' }
      );

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
      await should(backend.ask).be.calledWith(
        'core:security:user:verifyById',
        {id: 42, password: 'password'},
      );
    });

    it('should update the user informations', async () => {
      backend.ask.withArgs('core:security:user:get')
        .resolves({
          id: 42,
          username: 'foo',
          email: 'bar',
          role: 'user'
        });

      backend.ask.withArgs('core:security:user:verifyById')
        .resolves(true);

      backend.ask.withArgs('core:security:user:update')
        .resolves({
          id: 42,
          username: 'USERNAME',
          email: 'EMAIL@EMAIL.COM',
          role: 'user',
        });

      const response = await authController.updateMyUser(request);

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
      await should(backend.ask).be.calledWith(
        'core:security:user:verifyById',
        {id: 42, password: 'password'},
      );
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

      backend.ask.withArgs('core:security:user:verifyById')
        .resolves(true);

      backend.ask.withArgs('core:security:user:update')
        .resolves(null);

      await should(authController.updateMyUser(request))
        .be.rejectedWith(
          SecurityError,
          { id: 'security:user:update_failed' }
        );

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
      await should(backend.ask).be.calledWith(
        'core:security:user:verifyById',
        {id: 42, password: 'password'},
      );
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

      backend.ask.withArgs('core:security:user:verifyById')
        .resolves(true);

      backend.ask.withArgs('core:security:user:update')
        .rejects({
          code: '23505',
          constraint: 'unique_username',
        });

      await should(authController.updateMyUser(request))
        .be.rejectedWith(
          SecurityError,
          { id: 'security:user:username_taken' }
        );

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
      await should(backend.ask).be.calledWith(
        'core:security:user:verifyById',
        {id: 42, password: 'password'},
      );
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

      backend.ask.withArgs('core:security:user:verifyById')
        .resolves(true);

      backend.ask.withArgs('core:security:user:update')
        .rejects({
          code: '23505',
          constraint: 'unique_email',
        });

      await should(authController.updateMyUser(request))
        .be.rejectedWith(
          SecurityError,
          { id: 'security:user:email_taken' }
        );

      await should(backend.ask).be.calledWith('core:security:user:get', 42);
      await should(backend.ask).be.calledWith(
        'core:security:user:verifyById',
        {id: 42, password: 'password'},
      );
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

  describe('#updateMyPassword', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
      request.context.user = { id: 42 };
      request.input.body = {
        oldPassword: 'foo',
        newPassword: 'bar',
      };
    });

    it('should reject if the user is not authenticated', async () => {
      request.context.user = { id: null };
      await should(authController.updateMyPassword(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:not_authenticated' }
      );
    });

    
    it('should reject if the given password does not match the user\'s password', async () => {
      backend.ask.withArgs('core:security:user:verifyById')
        .resolves(false);

      await should(authController.updateMyPassword(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:invalid_credentials' }
      );

      await should(backend.ask).be.calledWith(
        'core:security:user:verifyById',
        {id: 42, password: 'foo'},
      );
    });

    it('should reject if the given password is too short', async () => {
      request.input.body.newPassword = 'a';
      backend.ask.withArgs('core:security:user:verifyById')
      .resolves(true);
      await should(authController.updateMyPassword(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:password_too_short' }
      );
    });

    it('should reject if the given password is too weak', async () => {
      request.input.body.newPassword = 'foobarbaz';
      authController._validatePasswordStrength = sinon.stub().returns(false);
      backend.ask.withArgs('core:security:user:verifyById')
        .resolves(true);

      await should(authController.updateMyPassword(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:password_too_weak' }
      );

      await should(backend.ask).be.calledWith(
        'core:security:user:verifyById',
        {id: 42, password: 'foo'},
      );
      await should(authController._validatePasswordStrength).be.calledWith('foobarbaz');
    });

    it('should update user information if the update succeeded', async () => {
      request.input.body.newPassword = 'foobarbaz';
      authController._validatePasswordStrength = sinon.stub().returns(true);
      backend.ask.withArgs('core:security:user:verifyById')
        .resolves(true);
      backend.ask.withArgs('core:security:user:updatePassword')
        .resolves({
          id: 42,
          username: 'foo',
          email: 'bar',
          role: 'user'
        });

      const response = await authController.updateMyPassword(request);

      await should(backend.ask).be.calledWith(
        'core:security:user:verifyById',
        {id: 42, password: 'foo'},
      );
      await should(authController._validatePasswordStrength).be.calledWith('foobarbaz');
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
      authController._validatePasswordStrength = sinon.stub().returns(true);
      backend.ask.withArgs('core:security:user:verifyById')
        .resolves(true);
      backend.ask.withArgs('core:security:user:updatePassword')
        .resolves(null);

      await should(authController.updateMyPassword(request))
        .be.rejectedWith(
          SecurityError,
          { id: 'security:user:update_failed' }
        );

      await should(backend.ask).be.calledWith(
        'core:security:user:verifyById',
        {id: 42, password: 'foo'},
      );
      await should(authController._validatePasswordStrength).be.calledWith('foobarbaz');
      await should(backend.ask).be.calledWith('core:security:user:updatePassword', 42, 'foobarbaz');
    });
  });

  describe('#deleteMyUser', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
      request.context.user = { id: 42 };
    });

    it('should reject if the user is not authenticated', async () => {
      request.context.user = { id: null };
      await should(authController.updateMyPassword(request)).be.rejectedWith(
        SecurityError,
        { id: 'security:user:not_authenticated' }
      );
    });

    it('should ask core:security:user:delete with the current user id', async () => {
      backend.ask.withArgs('core:security:user:delete')
        .resolves(true);

      const response = await authController.deleteMyUser(request);

      await should(backend.ask).be.calledWith('core:security:user:delete', 42);

      await should(response).be.true();
    });
  });
});