'use strict';

async function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function promisify (fn, ...args) {
  return fn(...args);
}

module.exports = { sleep, promisify };