'use strict';

const BaseController = require('./BaseController');
const FileDownload = require('../../core/network/FileDownload');

class DownloadController extends BaseController {
  constructor () {
    super([
      { verb: 'get', path: '/client.apk', action: 'downloadAPK', rootPath: true},
    ]);
  }

  /**
   * Initialize the controller.
   * @param {Backend} backend
   */
  async init (backend) {
    super.init(backend);
  }

  /**
   * Initiate APK Downloading
   * @param {Request} request
   * 
   * @openapi
   * @action downloadAPK
   * @description Initiate APK Downloading
   * @return {FileDownload} {}
   */
  async downloadAPK(req) {
    return await FileDownload.Instantiate(
      '/build/app.apk',
      {
        contentType: 'application/vnd.android.package-archive',
        filename: 'client.apk'
      }
    );
  }
}

module.exports = DownloadController;