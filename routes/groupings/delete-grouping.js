const RecordNotFound = require('../../errors').RecordNotFound;
module.exports = Grouping => {
  return async (req, res) => {
    /* TODO validate id */
    let id = req.params.id;

    try {
      await Grouping.delete(id);
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
