'use strict';

class ProductRepository {
  constructor () {
    this.backend = null;
  }

  /**
   * Initialize the repository
   * @param {Backend} backend
   */
  async init (backend) {
    this.backend = backend;

    /**
     * Register all the askable methods
     */
    backend.onAsk('core:product:get', this.getProduct.bind(this));
    backend.onAsk('core:product:add', this.addProduct.bind(this));
  }

  async getProduct (code) {
    const result = await this.backend.ask(
      'postgres:query',
      'SELECT * FROM products WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async addProduct (product) {
    const result = await this.backend.ask(
      'postgres:query',
      'INSERT INTO products (code, name, image, ingredients, price, brand, nutriScore, raw) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [product.code, product.name, product.image, product.ingredients, product.price, product.brand, product.nutriScore, product.raw]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }


}

module.exports = ProductRepository;