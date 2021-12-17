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
   * 
   * @openapi
   * @action getProductByCode
   * @description Get product informations by code
   * @templateParam {string} code The barcode of the product.
   * @bodyParam {boolean:false} raw Add raw product informations.
   * @successField {string:"20020392"} code The product barcode
   * @successField {string:"Sirop de grenadine"} name The product name
   * @successField {string:"https://www..."} image The url of the product image
   * @successField {string:"https://www...."} ingredients The url of the product ingredients image
   * @successField {string:"Plein Sud"} brand The product's brand
   * @successField {number:4.2} price The product's price
   * @successField {string:"a"} nutriScore The product nutriScore from [a, b, c, d, e]
   * @successField {object} raw The raw product details
   * @error api:product:not_found
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
   * Buy every product listed
   * @param {Request} req
   * 
   * @openapi
   * @action payShoppingCart
   * @description Buy every product listed
   * @bodyParam {Array<{}>:{"code": "20020392", "quantity": 42}} products A list of products.
   * @bodyParam {string:"cc371db2-8f9a-4f28-bb4d-2220906b371e"} accountId BankAccount ID.
   * @bodyParam {string:"6666"} vcc BankAccount visual cryptographic code.
   * @return {boolean} true
   * @error request:invalid:missing_argument
   * @error security:transaction:rejected
   * @error api:bankAccount:verification_failed
   * @error api:bankAccount:not_found
   * @error security:transaction:insufficient_funds
   * @error api:product:not_found
   */
  async payShoppingCart(req) {
    const products = req.getBodyArray('products');
    const accountId = req.getBodyString('accountId');
    const vcc = req.getBodyString('vcc');

    // Verify product informations
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      if (product.code === undefined
        || product.code === null
      ) {
        error.throwError('request:invalid:missing_argument', `body.products[${i}].code`);
      }

      if  (typeof product.quantity !== 'number') {
        error.throwError('request:invalid:invalid_type', `body.products[${i}].quantity`, 'number');
      }

      if (product.quantity <= 0) {
        error.throwError('request:invalid:missing_argument', `body.products[${i}].quantity`);
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
    const validCreditCard = await this.backend.ask('core:bankAccount:verify', accountId, vcc);
    if (!validCreditCard) {
      error.throwError('api:bankAccount:verification_failed');
    }

    const account = await this.backend.ask('core:bankAccount:get', accountId);
    // Should never happend
    if (!account) {
      error.throwError('api:bankAccount:not_found');
    }

    // Verify if account has enough money
    if (account.balance < totalPrice) {
      error.throwError('security:transaction:insufficient_funds');
    }

    await this.backend.ask('core:bankAccount:setBalance', accountId, account.balance - totalPrice);
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