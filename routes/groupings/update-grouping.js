const RecordNotFound = require('../../errors').RecordNotFound;
module.exports = Grouping => {
  return async (req, res) => {
    /* TODO: validate input */
    let data = req.body;

    /* TODO validate id */
    let id = req.params.id;

    /* Save data to db */
    try {
      await Grouping.update(id, data, req.user.profile.name);
      res.status(200).send('Success');
    } catch (e) {
      if (e instanceof RecordNotFound) {
        return res.boom.badRequest(e.message);
      } else {
        throw e;
      }
    }
  };
};
