'use strict';

const BackendStateEnum = require('../types/BackendState');
const error = require('../errors');
const {
  AuthController,
  SecurityController,
  BankAccountController,
  ProductController,
  DownloadController,
} = require('./controllers');

const InternalError = require('../errors/internalError');
const User = require('../model/user');
const RateLimiter = require('./rateLimiter');

class Funnel {
  constructor () {
    this.controllers = new Map();
    this.backend = null;
    this.permissions = {};
    this.rateLimiter = new RateLimiter();

    this.controllers.set('auth', new AuthController());
    this.controllers.set('security', new SecurityController());
    this.controllers.set('bankaccount', new BankAccountController());
    this.controllers.set('product', new ProductController());
    this.controllers.set('download', new DownloadController());
  }

  async init (backend) {
    this.backend = backend;
    this.permissions = backend.config.permissions;

    await this.rateLimiter.init(backend);
    /**
     * Declare the controllers with their names
     * @type {Map<string, BaseController>}
     */

    /**
     * Create every routes for each controller
     */
    for (const [controllerName, controller] of this.controllers) {
      this.backend.logger.debug(`Initializing controller "${controllerName}":`);
      for (const route of controller.__actions) {
        // If a / is missing at the start of the path we add it
        const pathPrefix = route.rootPath ? '' : controllerName;
        const path = route.path[0] === '/' ? `${pathPrefix}${route.path}` : `${pathPrefix}/${route.path}`;

        if (!controller[route.action] || typeof controller[route.action] !== 'function') {
          throw new InternalError(`Cannot attach path ${route.verb.toUpperCase()} /api/${path}: no action ${route.action} for controller ${controllerName}`);
        }
        // Add the route to the router
        const prefix = route.rootPath ? '' : '/api/';
        this.backend.router.attach(route.verb, `${prefix}${path}`, controller[route.action].bind(controller), controllerName, route.action);
        this.backend.logger.debug(`  ${route.verb.toUpperCase()} ${prefix}${path} -> ${controllerName}:${route.action}`);
      }
    }

    // Wait for every controllers to be initialized
    return Promise.all(
      Array.from(this.controllers.values()).map(controller => controller.init(backend))
    );
  }

  /**
   * Process the request, check rights, and call the controller
   * @param {Request} req
   * @param {callback} callback
   * @returns {void}
   */
  execute (req, callback) {
    if (this.backend.state === BackendStateEnum.SHUTTING_DOWN) {
      return callback(error.getError('request:discarded:shutdown'));
    }

    this.checkRights(req).then(() => {

      return this.rateLimiter.isAllowed(req).then((allowed) => {
        if (!allowed) {
          callback(
            error.getError('request:rate:limit_exceeded', req.getController(), req.getAction())
          );
          return;
        }

        return req.routerPart.handler(req).then(result => {
          req.setResult(result);
          callback(null, req);
        });
      });
    }).catch(err => {
      callback(err);
    });
  }

  /**
   * Verify if the user is logged in and has the right to access the controller actions
   * @param {Request} req
   */
  async checkRights (req) {
    const token = await this.backend.ask('core:security:token:verify', req.getJWT());
    req.context.user = token ? new User(token.userId) : new User(null);

    if (req.isAnonymous()) {
      this.backend.logger.debug('Request made as anonymous');
      if (!this.hasPermission('anonymous', req.getController(), req.getAction())) {
        this.backend.logger.debug(`Insufficient permissions to execute ${req.getController()}:${req.getAction()}`);
        error.throwError('security:permission:denied', req.getController(), req.getAction());
      }
    } else {
      const userInfo = await this.backend.ask('core:security:user:get', token.userId);

      if (!userInfo) {
        error.throwError('security:user:with_id_not_found', token.userId);
      }

      this.backend.logger.debug(`Request made as ${userInfo.username} (ID: ${userInfo.id}, role: ${userInfo.role})`);
      if (!this.hasPermission(userInfo.role, req.getController(), req.getAction())) {
        this.backend.logger.debug(`Insufficient permissions to execute ${req.getController()}:${req.getAction()}`);
        error.throwError('security:permission:denied', req.getController(), req.getAction());
      }
    }
  }

  hasPermission(role, controller, action) {
    if (this.permissions[role]) {
      const rolePermissions = this.permissions[role];
      if (rolePermissions['*']) {
        return Boolean(rolePermissions['*']['*'] || rolePermissions['*'][action]);
      }
      if (rolePermissions[controller]) {
        return Boolean(rolePermissions[controller]['*'] || rolePermissions[controller][action]);
      }
    }
    return false;
  }
}

module.exports = Funnel;