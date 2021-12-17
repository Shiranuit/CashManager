'use strict';

const BaseController = require('./BaseController');
const error = require('../../errors');
const axios = require('axios');

class ProductController extends BaseController {
  constructor () {
    super([
      { verb: 'get', path: '/:code', action: 'getProductByCode' },
      { verb: 'post', path: '/pay', action: 'payShoppingCart' },
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

    const product = await this._fetchProduct(code);

    if (!raw) {
      delete product.raw;
    }

    return product;
  }

  /**
   * Buy every product in the shopping cart
   * @param {Request} req
   */
  async payShoppingCart(req) {
    const products = req.getBodyArray('products');
    const creditCardNumber = req.getBodyString('creditCardNumber');
    const vcc = req.getBodyString('vcc');

    // Verify product informations
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      if (product.code === undefined
        || product.code === null
      ) {
        error.throwError('api:product:missing_code', `body.products[${i}].code`);
      }

      if (product.quantity === undefined
        || product.quantity === null
        || product.quantity <= 0
      ) {
        error.throwError('api:product:missing_quantity', `body.products[${i}].quantity`);
      }
    }

    let totalPrice = 0;
    for (const product of products) {
      const productInfo = await this._fetchProduct(product.code.toString());
      totalPrice += productInfo.price * product.quantity;
    }

    if (totalPrice < 0) {
      error.throwError('security:transaction:rejected', 'Price is negative');
    }

    // Verify credit card informations
    const validCreditCard = this.backend.ask('core:bankAccount:verify', creditCardNumber, vcc);
    if (!validCreditCard) {
      error.throwError('api:bankAccount:verification_failed');
    }

    const account = await this.backend.ask('core:bankAccount:get', creditCardNumber);
    // Should never happend
    if (!account) {
      error.throwError('api:bankAccount:not_found');
    }

    // Verify if account has enough money
    if (account.balance < totalPrice) {
      error.throwError('security:transaction:insufficient_balance');
    }

    await this.backend.ask('core:bankAccount:setBalance', creditCardNumber, account.balance - totalPrice);
    return true;
  }

  /**
   * Fetch product informations based on the Barcode
   * @param {string} code
   * @returns {Promise<Product>}
   */
  async _fetchProduct(code) {
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

    return product;
  }
}

module.exports = ProductController;