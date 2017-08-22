const environment = process.env.NODE_ENV || 'user';
const config = require('../knexfile.js')[environment];
var pg = require('pg');

pg.defaults.ssl = true;

const db = require('knex')(config);

module.exports = db;
