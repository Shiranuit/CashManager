'use strict';

const should = require('should');
const sinon = require('sinon');
const TokenRepository = require('../../../lib/core/security/tokenRepository');
const BackendMock = require('../../mocks/backend.mock');

describe('TokenRepository', () => {
  let backend;
  let tokenRepository;
  beforeEach(async () => {
    backend = new BackendMock({
      auth: {
        jwt: {
          secret: 'secret'
        }
      }
    });
    tokenRepository = new TokenRepository();
    await tokenRepository.init(backend);
  });

  describe('#init', () => {
    it('should setup onAsk methods', async() => {
      backend = new BackendMock({
        auth: {
          jwt: {
            secret: 'secret'
          }
        }
      });
      tokenRepository = new TokenRepository();
      
      await tokenRepository.init(backend);

      await should(backend.onAsk).be.calledWith('core:security:token:create');
      await should(backend.onAsk).be.calledWith('core:security:token:delete');
      await should(backend.onAsk).be.calledWith('core:security:token:verify');
    });
  });
});