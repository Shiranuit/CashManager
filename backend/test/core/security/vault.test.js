'use strict';

const should = require('should');
const sinon = require('sinon');
const { vault } = require('../../../config');
const Vault = require('../../../lib/core/security/vault');
const BackendMock = require('../../mocks/backend.mock');

describe('Vault', () => {
  let backend;
  let vault;
  beforeEach(async () => {
    backend = new BackendMock({
      vault: {
        algorithm: 'sha256',
        salt: 'secret',
        derivationRound: 10
      }
    });
    vault = new Vault();
    await vault.init(backend);
  });

  describe('#init', () => {
    it('should reject if cannot connect to the database', async() => {
      backend = new BackendMock({
        vault: {
          algorithm: 'sha256',
          salt: 'secret',
          derivationRound: 10
        }
      });
      vault = new Vault();
      
      await vault.init(backend);

      await should(backend.onAsk).be.calledWith('core:security:vault:hash');
      await should(backend.onAsk).be.calledWith('core:security:vault:verify');
    });
  });

  describe('#verify', () => {
    it('should return true when two string are identical', async () => {
      const result = await vault.verify('foo', 'foo');

      await should(result).be.true();
    });

    it('should return true when two string are identical', async () => {
      const result = await vault.verify('foo', 'bar');

      await should(result).be.false();
    });
  });

  describe('#hash', () => {
    it('should hash the string', async () => {
      const result = await vault.hash('foo');

      await should(result)
        .not.be.null()
        .and.not.be.eql('foo');
      await should(result.length).be.above(3);
    });
  });
});