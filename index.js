/* Include .env file config */
require('dotenv').config();

/* Imports */
const minimist = require('minimist');
const logger = require('./utils/logger')('api');
const xtend = require('xtend');

/* Settings */
const PORT = process.env.PORT || 4040;

/* Initialize app server */
const app = require('./lib').init({ logger }).app;

/* Kickoff server */
app.listen(PORT, function(err) {
  logger.info('Server listening on port', PORT);
});
