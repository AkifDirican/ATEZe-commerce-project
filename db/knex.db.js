const knex = require('knex');
const config = require('../config/knex-config');

const db = knex(config.development);

module.exports = {db};