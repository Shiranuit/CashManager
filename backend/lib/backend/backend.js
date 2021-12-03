'use strict';

const BackendEventEmitter = require('./events/backendEventEmitter');
const Funnel = require('../api/funnel');
const EntryPoint = require('../core/network/entrypoint');
const BackendStateEnum = require('../types/BackendState');
const SecurityModule = require('../core/security');
const RepositoryModule = require('../core/repository');
const Logger = require('./logger');
const Router = require('../core/network/router');
const Postgres = require('../services/postgres/postgres');

class Backend extends BackendEventEmitter {

  constructor (config) {
    super();
    this.config = config;

    this.funnel = new Funnel();
    this.entryPoint = new EntryPoint();
    this.router = new Router();
    this.postgres = new Postgres();

    this.security = new SecurityModule();
    this.repository = new RepositoryModule();

    this.logger = new Logger(this);
    this.state = BackendStateEnum.STARTING;
  }

  /**
   * Calls any method instanciated by backend modules based on the given event
   * @param {string} event
   * @param  {...any} args
   * @returns {any}
   */
  async ask (event, ...args) {
    const _args = {...args};
    this.logger.debug(`Ask ${event} ${JSON.stringify(_args)}:`);
    const result = await super.ask(event, ...args);
    this.logger.debug(`${JSON.stringify(result, null, 4)}`);
    return result;
  }

  /**
   * Starts the backend
   */
  async start () {
    try {
      // Backend is starting
      this.logger.info('Starting backend...');

      // Initialize the backend modules
      await this.postgres.init(this);
      await this.router.init(this);
      await this.funnel.init(this);
      await this.entryPoint.init(this);
      await this.security.init(this);
      await this.repository.init(this);

      // Module initialized, requests still not accepted
      // Listening incoming requests
      await this.entryPoint.startListening();

      // Backend is ready
      this.state = BackendStateEnum.RUNNING;
      this.logger.info('Backend has started');
    } catch (err) {
      this.logger.error(err.stack);
      await this.shutdown();
    }
  }

  /**
   * Stops the backend
   */
  async shutdown () {
    this.state = BackendStateEnum.SHUTTING_DOWN;
    this.logger.info('Backend is shutting down');

    await this.entryPoint.stopListening();
  }

}

module.exports = { Backend };