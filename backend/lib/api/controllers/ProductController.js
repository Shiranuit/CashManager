'use strict';

const BaseController = require('./BaseController');
const error = require('../../errors');
const axios = require('axios');

class ProductController extends BaseController {
  constructor () {
    super([
      { verb: 'get', path: '/:code', action: 'getProductByCode' },
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
   * Get product informations by code
   * @param {Request} req 
   */
  async getProductByCode (req) {
    const code = req.getString('code');
    const raw = req.getBodyBoolean('raw', false);

    // Try fetch from DB, faster and more reliable
    let product = await this.backend.ask('core:product:get', code);
    
    //  If found in DB, return it
    if (product) {
      if (!raw) {
        delete product.raw;
      }
      return product;
    }

    // If not found in DB, try fetch from API
    this.backend.logger.debug(`Product ${code} not found in DB, fetching from API`);
    const response = await axios.get(`http://tungsten.ovh:7575/barcode/${code}`);
    this.backend.logger.debug(`Product ${code} fetched from API`);

    // If not found in API, return error
    if (response.data.status === 0) {
      error.throwError('api:product:not_found', code);
    }

    // If found in API, create product in DB and return it
    const productData = {
      code: response.data.code,
      name: response.data.product.product_name || response.data.product.product_name_fr,
      price: response.data.product.price,
      image: response.data.product.image_url,
      brand: response.data.product.brands,
      nutriScore: response.data.product.nutriscore_grade,
      ingredients: response.data.product.image_ingredients_url,
      raw: response.data.product,
    };

    product = await this.backend.ask('core:product:add', productData);

    if (!product) {
      error.throwError('api:product:not_found', code);
    }

    if (!raw) {
      delete product.raw;
    }

    return product;
  }
}

module.exports = ProductController;