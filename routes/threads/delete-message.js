const RecordNotFound = require('../../errors').RecordNotFound;

module.exports = Thread => {
  return async (req, res) => {
    let id = req.params.id;

    await Thread.deleteMessage(id);
    res.status(200).send('Success');
  };
};
