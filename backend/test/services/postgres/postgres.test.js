'use strict';

const should = require('should');
const sinon = require('sinon');
const Postgres = require('../../../lib/services/postgres/postgres');
const BackendMock = require('../../mocks/backend.mock');

describe('Postgres', () => {
  let backend;
  let postgres;
  beforeEach(async () => {
    backend = new BackendMock({
      postgres: {
        retryDelay: '666ms',
        maxRetries: 3
      }
    });
    postgres = new Postgres();
  });

  describe('#init', () => {
    it('should reject if cannot connect to the database', async() => {
      backend = new BackendMock({
        postgres: {
          retryDelay: '666ms',
          maxRetries: 3
        }
      });
      postgres = new Postgres(backend);
      
      postgres._sleep = sinon.stub();
      postgres.connect = sinon.stub().rejects();
      await should(postgres.init(backend)).be.rejected();
      await should(postgres._sleep).be.calledWith(666);
    });

    it('be fullfilled if succesfuly connect', async() => {
      backend = new BackendMock({
        postgres: {
          retryDelay: '666ms',
          maxRetries: 3
        }
      });
      postgres = new Postgres();
      
      postgres._sleep = sinon.stub();
      postgres.connect = sinon.stub();
      postgres.connect.onCall(0).rejects();
      postgres.connect.onCall(1).rejects();
      postgres.connect.onCall(2).resolves();
      await should(postgres.init(backend)).be.fulfilled();
      await should(postgres.connect).be.calledThrice();

      await should(backend.onAsk).be.calledWith('postgres:query', sinon.match.func);
    });
  });

  describe('#query', () => {
    it('should call client query', async () => {
      backend = new BackendMock({
        postgres: {
          retryDelay: '666ms',
          maxRetries: 3
        }
      });
      postgres = new Postgres();

      postgres.client = {
        query: sinon.stub()
      };

      postgres._sleep = sinon.stub();
      postgres.connect = sinon.stub().resolves();

      await postgres.query('SELECT * FROM table');
      await should(postgres.init(backend)).be.fulfilled();
      await should(postgres.client.query).be.calledWith('SELECT * FROM table');
    })
  });
});