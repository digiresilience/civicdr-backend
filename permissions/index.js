const R = require('ramda');

/*
 * Each permission object contains {key: (conn) => (req) => Boolean}
 * Where key is an action such as 'read:ticket' and boolean
 * is whether the user can do this action
 */

const notAllowed = () => () => false;
const allowed = () => () => true;

// Meta
// These routes take the profile from the token
const metaPermissions = {
  admin: notAllowed,
  'has-profile': allowed
};

// Ticket
const ticketPermissions = {
  'create:ticket': require('./create-ticket'),
  'update:ticket': require('./update-ticket'),
  'read:tickets': require('./read-tickets')
};

// Profile
const profilePermissions = {
  'update:profile': require('./update-profile')
};

// Threads
const threadPermissions = {
  'update:thread': require('./update-thread'),
  'delete:message': require('./delete-message')
};

module.exports = R.curry((conn, logger, ability) => {
  const IpProfile = require('../models/ip_profile')(conn);
  const SpProfile = require('../models/sp_profile')(conn);

  const isAllowed = R.mergeAll([
    metaPermissions,
    ticketPermissions,
    profilePermissions,
    threadPermissions
  ]);

  let f = async (req, res, next) => {
    if (ability === 'public') {
      return next();
    }
    if (req.user) {
      req.user.roles = req.user.roles || [];
      if (R.contains('admin', req.user.roles)) {
        // Admin role can do everything
        req.user.profile = { id: 1, name: 'Admin' };
        req.user.role = 'admin';

        logger.info(`${req.id} - Requested by Admin`);
        next();
      } else {
        if (R.contains('IP', req.user.roles)) {
          let [profile] = await IpProfile.findByOpenId(req.user.sub);
          req.user.profile = profile;
          req.user.role = 'ip';
        }
        if (R.contains('SP', req.user.roles)) {
          let [profile] = await SpProfile.findByOpenId(req.user.sub);
          req.user.profile = profile;
          req.user.role = 'sp';
        }
        logger.info(`${req.id} - Requested by ${req.user.sub}`);

        let allowed = await isAllowed[ability](conn)(req);
        if (allowed) {
          next();
        } else {
          res.status(403).json({ message: 'Forbidden' });
        }
      }
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  };

  return (req, res, next) => {
    f(req, res, next).then(null, next);
  };
});
