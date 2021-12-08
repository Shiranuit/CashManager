'use strict';

class RouterPart {

  constructor (method, path, handler, controller, action) {
    this.method = method;
    this.path = `/${path}`;
    this.handler = handler;
    this.template = this._constructTemplate(path);
    this.templatePath = '/' + this.template.map(item => item.template).join('/');
    this.controller = controller;
    this.action = action;

  }

  /**
   * Generate the templated path used to extract variables from path
   * like this: /path/:template/
   * @param {string} path 
   * @returns {Array<{
   *  placeholder: boolean
   *  name: string
   *  template: string
   * }>}
   */
  _constructTemplate (path) {
    const templatePath = [];
    for (const subPath of path.split('/')) {
      if (subPath[0] === ':') {
        templatePath.push({
          placeholder: true,
          name: subPath.slice(1),
          template: '*'
        });
      } else {
        templatePath.push({
          placeholder: false,
          name: subPath,
          template: subPath,
        });
      }
    }

    return templatePath;
  }

  /**
   * Get the method associated to the routerPart
   * @returns {string}
   */
  getMethod () {
    return this.method;
  }

  /**
   * Get the path associated to the routerPart
   * @returns {string}
   */
  getPath () {
    return this.path;
  }

  /**
   * Get the callback associated to the routerPart
   * @returns {callback}
   */
  getHandler () {
    return this.handler;
  }

  /**
   * Get the templated path associated to the routerPart
   * @returns {string}
   */
  getTemplatePath () {
    return this.templatePath;
  }

  /**
   * Get the template associated to the routerPart
   * @returns {Array<{
   *  placeholder: boolean
   *  name: string
   *  template: string
   * }>}
   */
  getTemplate () {
    return this.template;
  }

  /**
   * Extract the templated parameters from the path
   * @param {string} path
   * @returns { {[key: string]: string} }
   */
  getParams (path) {
    const _path = path.split('/').filter(item => item !== '');
    const params = {};

    for (let i = 0; i < this.template.length; i++) {
      if (this.template[i].placeholder) {
        params[this.template[i].name] = decodeURIComponent(_path[i]);
      }
    }

    return params;
  }

}

module.exports = RouterPart;