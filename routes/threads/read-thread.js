const defined = require('defined');

module.exports = Thread => {
  return async (req, res) => {
    let id = req.params.id;
    let [thread] = await Thread.findById(id);

    if (defined(thread)) {
      res.status(200).json(thread);
    } else {
      res.boom.notFound('That thread does not exist');
    }
  };
};
