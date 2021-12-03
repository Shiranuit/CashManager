'use strict';

const should = require('should');
const sinon = require('sinon');
const BackendMock = require('../mocks/backend.mock');
const Request = require('../../lib/api/requests/request');
const SecurityError = require('../../lib/errors/securityError');
const BadRequestError = require('../../lib/errors/badRequestError');
const ServiceUnavailableError = require('../../lib/errors/serviceUnavailableError');
const Funnel = require('../../lib/api/funnel');
const RouterMock = require('../mocks/router.mock');
const RateLimiterMock = require('../mocks/rateLimiter.mock');
const BackendStateEnum = require('../../lib/types/BackendState');
const User = require('../../lib/model/user');

describe('Funnel', () => {
  let funnel;
  let backend;
  beforeEach(async () => {
    funnel = new Funnel();
    funnel.rateLimiter = new RateLimiterMock();
    backend = new BackendMock();
    await funnel.init(backend);
  });


  describe('#constructor', () => {
    it('should instantiate the controllers', () => {
      funnel = new Funnel();
      funnel.rateLimiter = new RateLimiterMock();
      backend = new BackendMock();

      should(funnel.controllers.has('auth')).be.true();
      should(funnel.controllers.has('security')).be.true();
    });
  });

  describe('#init', () => {
    it('should init the rate limiter', async () => {
      funnel = new Funnel();
      funnel.rateLimiter = new RateLimiterMock();
      backend = new BackendMock();
      await funnel.init(backend);

      await should(funnel.rateLimiter.init).be.calledOnce();
    });

    it('should init the controllers', async () => {
      funnel = new Funnel();
      funnel.rateLimiter = new RateLimiterMock();
      backend = new BackendMock();
      funnel.controllers = new Map();
      const stub1 = sinon.stub();
      const stub2 = sinon.stub();

      funnel.controllers.set('controller1', { init: stub1, __actions: [] });
      funnel.controllers.set('controller2', { init: stub2, __actions: [] });

      await funnel.init(backend);

      should(stub1).be.calledOnce();
      should(stub2).be.calledOnce();
    });

    it('should init the controllers routes', async () => {
      funnel = new Funnel();
      funnel.rateLimiter = new RateLimiterMock();
      backend = new BackendMock();
      
      const fooStub = sinon.stub();
      const barStub = sinon.stub();
      funnel.controllers = new Map();
      funnel.controllers.set('controller', {
        init: sinon.stub(),
        __actions: [
          {verb: 'get', path: '/foo', action: 'foo'},
          {verb: 'post', path: '/bar/:id', action: 'bar'},
        ],
        foo: fooStub,
        bar: barStub,
      });
      
      await funnel.init(backend);

      await should(backend.router.attach).be.calledWith('get', '/api/controller/foo', sinon.match.func, 'controller', 'foo');
      await should(backend.router.attach).be.calledWith('post', '/api/controller/bar/:id', sinon.match.func, 'controller', 'bar');
    });
  });

  describe('#execute', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
      request.getController = () => 'controller';
      request.getAction = () => 'action';
      request.isAnonymous = () => true;
    });

    it('should reject requests when backend is shutting down', async () => {
      backend.state = BackendStateEnum.SHUTTING_DOWN;
      const callback = sinon.stub();

      funnel.execute(request, callback);

      await should(callback).be.calledWith(sinon.match.instanceOf(ServiceUnavailableError));
    });

    it('should verify the permissions', async () => {
      const checkRights = sinon.spy(funnel, 'checkRights');

      const callback = sinon.stub();

      funnel.execute(request, callback);

      await should(checkRights)
        .be.calledOnce()
        .and.be.calledWith(request);
    });

    it('should not execute request if not allowed to', async () => {
      const checkRights = sinon.spy(funnel, 'checkRights');
      funnel.hasPermission = () => false;

      let resolve, reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });

      const callback = (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      };

      funnel.execute(request, callback);

      await should(checkRights)
        .be.calledOnce()
        .and.be.calledWith(request);

      await should(promise).be.rejectedWith(
        SecurityError,
        { id: 'security:permission:denied' }
      );
    });
  });

  describe('#checkRights', () => {
    let request;
    beforeEach(() => {
      request = new Request({
        url: '',
        headers: {},
        host: '',
      });
      request.getController = () => 'controller';
      request.getAction = () => 'action';
      request.getJWT = () => 'token';
    });

    it('should verify the jwt', async () => {
      backend.ask.withArgs('core:security:token:verify').resolves(null);

      await should(funnel.checkRights(request));
      await should(backend.ask).be.calledWith('core:security:token:verify', 'token');
      await should(request.context.user).be.an.instanceOf(User);
    });

    
    it('should reject if the user has not permission to execute the action', async () => {
      backend.ask.withArgs('core:security:token:verify').resolves(null);
      funnel.hasPermission = sinon.stub().returns(false);

      await should(funnel.checkRights(request))
        .be.rejectedWith(
          SecurityError,
          { id: 'security:permission:denied' }
        );

      await should(funnel.hasPermission).be.calledWith('anonymous', 'controller', 'action');

      backend.ask.withArgs('core:security:token:verify').resolves({ userId: 1 });
      backend.ask.withArgs('core:security:user:get').resolves({ id: 1, role: 'user' });

      await should(funnel.checkRights(request))
        .be.rejectedWith(
          SecurityError,
          { id: 'security:permission:denied' }
        );

      await should(backend.ask).be.calledWith('core:security:user:get', 1);
      await should(funnel.hasPermission).be.calledWith('user', 'controller', 'action');
    });

    it('should reject even if the user does not exists', async () => {
      backend.ask.withArgs('core:security:token:verify').resolves({ userId: 1 });
      backend.ask.withArgs('core:security:user:get').resolves(null);

      await should(funnel.checkRights(request))
        .be.rejectedWith(
          SecurityError,
          { id: 'security:user:with_id_not_found' }
        );

      await should(backend.ask).be.calledWith('core:security:user:get', 1);
    });
  });
});