'use strict';

const should = require('should');
const BackendEventEmitter = require('../../../lib/backend/events/backendEventEmitter')
const { promisify } = require('../../../lib/utils/prom');

describe('BackendEventEmitter', () => {
  let emitter;
  beforeEach(() => {
    emitter = new BackendEventEmitter();
  });

  describe('#onAsk', () => {
    it('should reject if the callback is not a function', async () => {
      const promise = promisify(emitter.onAsk.bind(emitter), 'foo', 'bar');

      await should(promise).be.rejectedWith(/Cannot listen to ask event ".+": ".+" is not a function/);
    });

    it('should reject if an event as already been registered with the same name', async () => {
      emitter.onAsk('foo', () => {});
      const promise = promisify(emitter.onAsk.bind(emitter), 'foo', () => {});

      await should(promise).be.rejectedWith('Cannot add a listener to the ask event "foo": event has already an answerer');
    });

    it('should add the event to the internal map', () => {
      should(emitter._ask.size).be.exactly(0);
      emitter.onAsk('foo', () => {});
      should(emitter._ask.size).be.exactly(1);
    });
  });

  describe('#ask', () => {
    it('should reject if there is no listener for a given event', async () => {
      await should(emitter.ask('foo')).rejectedWith('Cannot ask event "foo": no listener');
    });

    it('should execute the callback with the given arguments', async () => {
      let count = 22;
      emitter.onAsk('foo', (value) => {
        count += value;
        return 666;
      });

      await should(count).be.exactly(22);
      const response = await emitter.ask('foo', 20);
      await should(response).be.exactly(666);
      await should(count).be.exactly(42);
    });
  });
});