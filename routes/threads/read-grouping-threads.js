const RecordNotFound = require('../../errors').RecordNotFound;

module.exports = Thread => {
  return async (req, res) => {
    let threads = await Thread.findByGroupingId(req.params.grouping_id);
    res.status(200).json(threads);
  };
};
