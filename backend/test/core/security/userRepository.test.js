'use strict';

const should = require('should');
const sinon = require('sinon');
const UserRepository = require('../../../lib/core/security/userRepository');
const BackendMock = require('../../mocks/backend.mock');

describe('UserRepository', () => {
  let backend;
  let userRepository;
  
  describe('#init', () => {
    it('should setup onAsk methods', async() => {
      backend = new BackendMock({
        auth: {
          jwt: {
            secret: 'secret'
          }
        }
      });
      userRepository = new UserRepository();
      
      userRepository.createFirstAdmin = sinon.stub();
      await userRepository.init(backend);

      await should(backend.onAsk).be.calledWith('core:security:user:create');
      await should(backend.onAsk).be.calledWith('core:security:user:verify');
      await should(backend.onAsk).be.calledWith('core:security:user:verifyById');
      await should(backend.onAsk).be.calledWith('core:security:user:get');
      await should(backend.onAsk).be.calledWith('core:security:user:update');
      await should(backend.onAsk).be.calledWith('core:security:user:updatePassword');
      await should(backend.onAsk).be.calledWith('core:security:user:list');
      await should(backend.onAsk).be.calledWith('core:security:user:delete');

      await should(userRepository.createFirstAdmin).be.calledOnce();
    });
  });
});