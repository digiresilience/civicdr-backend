/* Imports */
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const morgan = require('morgan');
const boom = require('express-boom');
const cors = require('cors');
const jwt = require('express-jwt');
const uuid = require('node-uuid');

/* App Server initialization
 * - Register middleware
 *   - compression
 *   - cors
 *   - bodyParser
 *   - error handling
 *   - permissions
 * - Register routes
 */
module.exports.init = function(opts) {
  const app = express();
  const client = require('./db');

  /* Router settings */
  app.use(compression());
  app.use(cors());
  app.use(bodyParser.json()); // for parsing application/json
  app.use(boom());

  /* Assign an id to every request */
  app.use(function(req, res, next) {
    req.id = uuid.v4();
    next();
  });

  /* Add Security Headers */
  app.use(function(req, res, next) {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubdomains'
    );
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  /* Configure logger */
  const env = process.env.NODE_ENV;
  let logger = opts.logger;

  if (!(env == 'test' || env == 'circle')) {
    morgan.token('id', req => req.id);
    // Apache combined format with request id
    logger.stream = {
      write: message => {
        logger.info(message);
      }
    };
    app.use(
      morgan(
        ':id :response-time ms - :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
        { stream: logger.stream }
      )
    );
  } else {
    // In the testing environment
    logger = require('winston');
    logger.remove(logger.transports.Console);
    logger.add(logger.transports.Console, {
      timestamp: true,
      level: 'error',
      colorize: true
    });
  }

  /* Permissions middleware */
  const check = require('./permissions')(client, logger);

  const profiles = require('./routes/profiles')(client);

  /* All routes require a token*/
  /* Checking Auth0 tokens occurs here */
  app.use(jwt({ secret: process.env.JWT_SECRET || opts.secret }));
  app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401).send('Invalid token.');
    }
  });

  /* Ticket routes */
  const tickets = require('./routes/tickets')(client);
  app.post('/tickets', check('create:ticket'), tickets.createTicket);
  app.get('/tickets/:id', check('update:ticket'), tickets.getTicket);
  app.put('/tickets/:id', check('update:ticket'), tickets.updateTicket);
  app.delete('/tickets/:id', check('admin'), tickets.deleteTicket);
  app.post(
    '/tickets/:ticket_id/duplicate/:profile_id',
    check('admin'),
    tickets.duplicateTicket
  );
  app.get('/tickets', check('read:tickets'), tickets.getTickets);
  app.post(
    '/tickets/:id/groupings/:grouping_id',
    check('admin'),
    tickets.addGrouping
  );
  app.delete(
    '/tickets/:id/groupings/:grouping_id',
    check('admin'),
    tickets.deleteGrouping
  );
  app.post(
    '/tickets/:id/sp_profiles/:profile_id',
    check('admin'),
    tickets.assignSpProfile
  );
  app.delete(
    '/tickets/:id/sp_profiles/:profile_id',
    check('admin'),
    tickets.unassignSpProfile
  );

  /* Grouping Routes */
  const groupings = require('./routes/groupings')(client);
  app.post('/groupings', check('admin'), groupings.createGrouping);
  app.get('/groupings/:id', check('admin'), groupings.getGrouping);
  app.put('/groupings/:id', check('admin'), groupings.updateGrouping);
  app.delete('/groupings/:id', check('admin'), groupings.deleteGrouping);
  app.get('/groupings', check('admin'), groupings.getGroupings);

  /* IP Profile Routes */
  app.post('/ip_profiles', check('admin'), profiles.createIpProfile);
  app.get('/ip_profiles/:id', check('update:profile'), profiles.getIpProfile);
  app.put(
    '/ip_profiles/:id',
    check('update:profile'),
    profiles.updateIpProfile
  );
  app.delete('/ip_profiles/:id', check('admin'), profiles.deleteIpProfile);
  app.get('/ip_profiles', check('admin'), profiles.getIpProfiles);

  /* SP Profile Routes */
  app.post('/sp_profiles', check('admin'), profiles.createSpProfile);
  app.get('/sp_profiles/:id', check('update:profile'), profiles.getSpProfile);
  app.put(
    '/sp_profiles/:id',
    check('update:profile'),
    profiles.updateSpProfile
  );
  app.delete('/sp_profiles/:id', check('admin'), profiles.deleteSpProfile);
  app.get('/sp_profiles', check('admin'), profiles.getSpProfiles);

  /* Own-Profile Routes */
  app.get('/profile', check('has-profile'), profiles.getProfile);
  app.post('/profile', check('has-profile'), profiles.createProfile);

  /* Thread & Messages Routes */
  const threads = require('./routes/threads')(client);
  app.get(
    '/tickets/:ticket_id/threads',
    check('update:ticket'),
    threads.getTicketThreads
  );
  app.get(
    `/groupings/:grouping_id/threads`,
    check('read:grouping'),
    threads.getGroupingThreads
  );
  app.get('/threads/:id', check('update:thread'), threads.getThread);
  app.post('/threads/:id/messages', check('update:thread'), threads.addMessage);
  app.delete('/messages/:id', check('delete:message'), threads.deleteMessage);

  /* Error handling */
  app.use(function(err, req, res, next) {
    logger.error(err.stack);
    next(err);
  });

  app.use(function(err, req, res, next) {
    res.status(500).send({ error: 'Server error!' });
  });

  /* Return app with registered routes */
  return {
    app,
    client
  };
};
