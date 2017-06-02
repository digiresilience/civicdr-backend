const withError = require('../../utils/with-error');

module.exports = conn => {
  const Grouping = require('../../models/grouping.js')(conn);
  return withError({
    createGrouping: require('./create-grouping')(Grouping),
    getGrouping: require('./read-grouping')(Grouping),
    getGroupings: require('./read-groupings')(Grouping),
    updateGrouping: require('./update-grouping')(Grouping),
    deleteGrouping: require('./delete-grouping')(Grouping)
  });
};
