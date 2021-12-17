'use strict';

const http = require('http');
const Request = require('../../api/requests/request');
const error = require('../../errors');
const InternalError = require('../../errors/internalError');
const FileDownload = require('./FileDownload');

class EntryPoint {
  constructor () {
    this.server = http.createServer(this.execute.bind(this));
    this.backend = null;
    this.config = null;
  }

  /**
   * Initialize the EntryPoint
   * @param {Backend} backend
   */
  async init (backend) {
    this.backend = backend;
    this.config = backend.config.http;
  }

  /**
   * Start listening incoming requests
   * @returns {Promise<void>}
   */
  async startListening () {
    this.server.listen(this.backend.config.http.port);
    this.backend.logger.info(`Backend is listening on port: ${this.backend.config.http.port}`);
  }

  /**
   * Stop listening for incoming requests
   * @returns {Promise<void>}
   */
  async stopListening () {

    let resolve = null;
    const promise = new Promise((res) => {
      resolve = res;
    });

    this.server.close(() => {
      resolve();
    });

    return promise;
  }

  /**
   * Apply Access-Control-Allow-Origin headers
   * @param {Request} req
   */
  _applyACAOHeaders(req, res) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', ['GET', 'POST', 'PUT', 'DELETE']);
    res.setHeader('X-Frame-Options', 'sameorigin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Vary', 'Origin');
  }

  /**
   * Process the incoming request,
   * find the appropriate handler and forward the request to the funnel
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   */
  execute (req, res) {
    try {
      this.processRequest(req, res);
    } catch (err) {
      this._applyACAOHeaders(req, res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const _err = new InternalError(err.message);
      _err.stack = err.stack;
      res.end(JSON.stringify(_err.toJSON()));
      this.backend.logger.debug(`Response: ${JSON.stringify(_err.toJSON(), null, 4)}`);
    }
  }

  /**
   * Send a file
   * @param {http.ServerResponse} res
   * @param {FileDownload} file 
   */
  sendFile(res, file) {
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${file.filename}`);
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Content-Length', file.length);

    file.stream.on('open', () => {
      file.stream.pipe(res);
    });

    file.stream.on('error', (err) => {
      const error = new InternalError(err.message);
      this.backend.logger.error(`Response: ${JSON.stringify(error.toJSON(), null, 4)}`);
      res.end(
        JSON.stringify({
          error: error.toJSON()
        })
      );
    });
  }

  /**
   * Process request and send result
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   */
  processRequest (req, res) {
    this.backend.logger.debug(`New request ${req.url}`);
    let request;
    try {
      request = new Request(req, res);
    } catch (err) {
      const _err = new InternalError('Failed to parse URL');
      _err.stack = null;
      this.backend.logger.error(err.toString());
      this._applyACAOHeaders(req, res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(_err.toJSON()));
      this.backend.logger.debug(`Response: ${JSON.stringify(_err.toJSON(), null, 4)}`);
      return;
    }
    /**
     * If an origin header is present in the request,
     * we need to verify that the origin is allowed to access the API
     * otherwise the request will be rejected.
     */
    if (req.headers.origin) {
      let found = false;
      for (const pattern of this.config.cors['Access-Control-Allow-Origin']) {
        if (pattern.test(req.headers.origin)) {
          found = true;
          break;
        }
      }

      if (!found) {
        this.backend.logger.warn(`Origin ${req.headers.origin} is not allowed`);
        const err = error.getError('request:origin:unauthorized', req.headers.origin);
        request.setError(err);
        this._applyACAOHeaders(req, res);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(request.response.toJSON()));
        this.backend.logger.debug(`Response: ${JSON.stringify(request.response.toJSON(), null, 4)}`);
        return;
      }
    }
    this.backend.logger.debug(`Request: ${request.input.getMethod()} ${request.input.getPath()} from ${req.socket.remoteAddress}`);

    const fullContent = [];
    // Accumulate the request body chunks
    req.on('data', data => {
      fullContent.push(data.toString());
    });

    // When the full body has been received, parse it
    req.on('end', () => {
      try {
        if (fullContent.length > 0) {
          // Concatenate the chunks together then parse JSON body
          request.input.body = JSON.parse(fullContent.join('')) || {};
        }
      } catch (e) {
        // If the body is not valid JSON, sends an error request:invalid:body
        // Apply default headers
        this._applyACAOHeaders(req, res);
        res.writeHead(200, {
          'Content-Type': 'application/json',
        });
        const err = error.getError('request:invalid:body');
        // Set the error to send
        request.setError(err);
        res.end(JSON.stringify(request.response.toJSON()));
        this.backend.logger.debug(`Response: ${JSON.stringify(request.response.toJSON(), null, 4)}`);
        return;
      }

      try {
        // Find the appropriate handler given the request method and path
        const routerPart = this.backend.router.find(request.input.getMethod(), request.input.getPath());

        request.input.action = routerPart.action;
        request.input.controller = routerPart.controller;
        request.routerPart = routerPart;

        // Retrieve the templated parameters based on the request path
        for (const [paramName, paramValue] of Object.entries(routerPart.getParams(request.input.getPath()))) {
          request.input.args[paramName] = paramValue;
        }
      } catch (e) {
        // If something fails, set the response to an error and sends it back formatted
        // Set the error to send
        request.setError(e);

        // Apply default headers
        this._applyACAOHeaders(req, res);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(request.response.toJSON()));
        this.backend.logger.debug(`Response: ${JSON.stringify(request.response.toJSON(), null, 4)}`);
        return;
      }

      /**
       * Forward the request to the funnel,
       * 1) the funnel will verify the token
       * 2) verify the user's permissions
       * 3) execute the controller and return the response
       */
      this.backend.funnel.execute(request, (err, result) => {
        const _res = result || request;

        if (err && !_res.response.error) {
          _res.setError(err);
        }

        // Apply default headers
        this._applyACAOHeaders(req, res);
        if (_res.response.result instanceof FileDownload) {
          const file = _res.response.result;
          this.backend.logger.debug(`Sending File: ${JSON.stringify(file.toJSON(), null, 4)}`);
          this.sendFile(res, _res.response.result);
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(_res.response.toJSON()));
        this.backend.logger.debug(`Response: ${JSON.stringify(_res.response.toJSON(), null, 4)}`);
      });
    });
  }
}

module.exports = EntryPoint;