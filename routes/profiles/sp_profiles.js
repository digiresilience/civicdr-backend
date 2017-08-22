const defined = require('defined');
const { RecordNotFound, NotNullViolation } = require('../../errors');
const has = require('has');

const R = require('ramda');

module.exports = (SpProfile, userAllowedKeys, Email) => {
  return {
    createSpProfile: async (req, res) => {
      /* TODO: validate input */
      let data = req.body;
      if (req.user.role === 'sp') {
        data = R.pick(userAllowedKeys, data);
      }

      /* Null rating becomes a rating of 3 */
      if (typeof data.rating !== 'undefined' && req.user.role === 'admin') {
        data.rating = 3;
      }

      /* Save data to  db */
      try {
        let id = await SpProfile.create(data, req.user);
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

    getSpProfile: async (req, res) => {
      /* TODO: validate input */
      let id = req.params.id;

      let [spProfile] = await SpProfile.findById(id);
      if (defined(spProfile)) {
        if (req.user.role === 'sp') {
          spProfile = R.pick(userAllowedKeys, spProfile);
        }
        res.status(200).json(spProfile);
      } else {
        res.boom.notFound('That profile does not exist');
      }
    },

    getSpProfiles: async (req, res) => {
      let spProfiles = await SpProfile.find();
      res.status(200).json(spProfiles);
    },

    updateSpProfile: async (req, res) => {
      /* TODO: validate input */
      let data = req.body;
      if (req.user.role === 'sp') {
        data = R.pick(userAllowedKeys, data);
      }

      /* Null rating becomes a rating of 3 on first edit*/
      if (typeof data.rating !== 'undefined' && req.user.role === 'admin') {
        data.rating = 3;
      }

      let id = req.params.id;

      /* Don't allow rescind code of practice after agreed */
      let [spProfile] = await SpProfile.findById(id);
      if (defined(spProfile)) {
        if (spProfile.code_of_practice === true) {
          data.code_of_practice = true;
        }
      }

      /* Save data to db */
      try {
        await SpProfile.update(id, data, req.user);

        // notify admin on updates
        await Email.notifyAdmin('SPProfileUpdate');
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
