const defined = require('defined');
const { RecordNotFound, NotNullViolation } = require('../../errors');
const has = require('has');
const R = require('ramda');

module.exports = (IpProfile, userAllowedKeys, Email) => {
  return {
    createIpProfile: async (req, res) => {
      /* TODO: validate input */
      let data = req.body;
      if (req.user.role === 'ip') {
        data = R.pick(userAllowedKeys, data);
      }

      /* Save data to  db */
      try {
        let id = await IpProfile.create(data, req.user);
        res.status(200).json(id);
      } catch (e) {
        if (e instanceof NotNullViolation) {
          res.boom.badData(e.message);
        } else {
          logger.error(e);
          res.boom.badImplementation('server error!');
        }
      }
    },

    /* If not admin and allowed to read own route
     * only provide allowed keys */
    getIpProfile: async (req, res) => {
      let id = req.params.id;

      let [ipProfile] = await IpProfile.findById(id);
      if (defined(ipProfile)) {
        if (req.user.role === 'ip') {
          ipProfile = R.pick(userAllowedKeys, ipProfile);
        }
        res.status(200).json(ipProfile);
      } else {
        res.boom.notFound('That profile does not exist');
      }
    },

    getIpProfiles: async (req, res) => {
      let ipProfiles = await IpProfile.find();
      res.status(200).json(ipProfiles);
    },

    updateIpProfile: async (req, res) => {
      /* TODO: validate input */
      let data = req.body;
      if (req.user.role === 'ip') {
        data = R.pick(userAllowedKeys, data);
      }

      let id = req.params.id;

      /* Don't allow changing agreement after agreed */
      let [ipProfile] = await IpProfile.findById(id);
      if (defined(ipProfile)) {
        if (ipProfile.partner_agreement === true) {
          data.partner_agreement = true;
        }
        if (ipProfile.code_of_practice === true) {
          data.code_of_practice = true;
        }
      }

      /* Save data to db */
      try {
        await IpProfile.update(id, data, req.user);

        // notify admin on updates
        await Email.notifyAdmin('IPProfileUpdate');
        res.status(200).send('Success');
      } catch (e) {
        if (e instanceof RecordNotFound) {
          return res.boom.badRequest(e.message);
        } else {
          throw e;
        }
      }
    }
  };
};
