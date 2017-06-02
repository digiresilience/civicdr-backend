const RecordNotFound = require('../../errors').RecordNotFound;

module.exports = Thread => {
  return async (req, res) => {
    let threads = await Thread.findByTicketId(req.params.ticket_id);

    // Remove threads if we're not an admin
    if (req.user.role === 'ip' || req.user.role === 'sp') {
      threads = threads.filter(
        thread => thread.participant === req.user.profile.id
      );
    }
    res.status(200).json(threads);
  };
};
