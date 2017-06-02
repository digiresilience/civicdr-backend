const defined = require('defined');
module.exports = Grouping => {
  return async (req, res) => {
    /* TODO: validate input */
    let id = req.params.id;

    let [grouping] = await Grouping.findById(id);
    if (defined(grouping)) {
      res.status(200).json(grouping);
    } else {
      res.boom.notFound('That grouping does not exist');
    }
  };
};
