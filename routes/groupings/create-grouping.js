const { NotNullViolation } = require('../../errors');

module.exports = Grouping => {
  return async (req, res) => {
    /* TODO: validate input */
    let data = req.body;

    /* Save data to  db */
    try {
      let id = await Grouping.create(data, req.user.profile.name);
      res.status(200).json(id);
    } catch (e) {
      if (e instanceof NotNullViolation) {
        return res.boom.badData(e.message);
      } else {
        throw e;
      }
    }
  };
};
