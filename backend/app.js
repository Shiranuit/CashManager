const { Backend } = require('./lib/backend/backend');
const config = require('./config');

const backend = new Backend(config);

backend.start();