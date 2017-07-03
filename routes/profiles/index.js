const R = require('ramda');
const defined = require('defined');
const withError = require('../../utils/with-error');
const xtend = require('xtend');
const { RecordNotFound, NotNullViolation } = require('../../errors');

const spAllowedKeys = [
  'id',
  'name',
  'services',
  'description',
  'contact',
  'secure_channels',
  'fees',
  'languages',
  'pgp_key',
  'start_time',
  'per_week_availability',
  'email_notification'
];

const ipAllowedKeys = [
  'id',
  'name',
  'contact',
  'location',
  'notification_prefs',
  'notification_languages',
  'types_of_work',
  'pgp_key',
  'secure_channels',
  'languages',
  'internal_level',
  'email_notification'
];

module.exports = conn => {
  // Models
  const IpProfile = require('../../models/ip_profile')(conn);
  const SpProfile = require('../../models/sp_profile')(conn);
  const Delete = require('../../models/delete')(conn);
  const Email = require('../../models/email')(conn);

  // Routes
  const IpProfileRoutes = require('./ip_profiles')(
    IpProfile,
    ipAllowedKeys,
    Email
  );
  const SpProfileRoutes = require('./sp_profiles')(
    SpProfile,
    spAllowedKeys,
    Email
  );

  let myProfile = {
    createProfile: async (req, res) => {
      let role = req.user.role;

      /* TODO: validate input */
      let data = xtend(
        {
          openid: req.user.sub
        },
        req.body
      );

      try {
        if (role === 'ip') {
          let id = await IpProfile.create(data);
          res.status(200).json(id);
        } else if (role === 'sp') {
          data.rating = data.rating || 0;
          let id = await SpProfile.create(data);
          res.status(200).json(id);
        } else {
          return res.boom.badRequest("Can't create profile");
        }
      } catch (e) {
        if (e instanceof NotNullViolation) {
          return res.boom.badData(e.message);
        } else {
          throw e;
        }
      }
    },

    getProfile: async (req, res) => {
      let profile = req.user.profile;

      if (!defined(profile)) {
        return res.boom.notFound();
      } else {
        if (req.user.role === 'ip') {
          profile = R.pick(ipAllowedKeys, profile);
        }

        if (req.user.role === 'sp') {
          profile = R.pick(spAllowedKeys, profile);
        }

        res.status(200).json(profile);
      }
    }
  };

  let deleteProfileRoute = type => {
    return async (req, res) => {
      let id = req.params.id;
      try {
        if (type === 'ip') {
          await Delete.deleteIp(id);
        } else if (type === 'sp') {
          await Delete.deleteSp(id);
        }
        res.status(200).send('Success');
      } catch (e) {
        if (e instanceof RecordNotFound) {
          res.boom.badRequest(e.message);
        } else {
          throw e;
        }
      }
    };
  };

  let deleteRoutes = {
    deleteIpProfile: deleteProfileRoute('ip'),
    deleteSpProfile: deleteProfileRoute('sp')
  };

  return withError(
    R.mergeAll([IpProfileRoutes, SpProfileRoutes, myProfile, deleteRoutes])
  );
};
