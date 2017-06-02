module.exports = Grouping => {
  return async (req, res) => {
    let groupings = await Grouping.find();
    res.status(200).json(groupings);
  };
};
