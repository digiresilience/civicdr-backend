const withError = require('../../utils/with-error');

module.exports = conn => {
  const Thread = require('../../models/thread')(conn);
  const Email = require('../../models/email')(conn);
  const Ticket = require('../../models/ticket')(conn);

  return withError({
    getTicketThreads: require('./read-ticket-threads')(Thread),
    getGroupingThreads: require('./read-grouping-threads')(Thread),
    getThread: require('./read-thread')(Thread),
    addMessage: require('./add-message')(Thread, Ticket, Email),
    deleteMessage: require('./delete-message')(Thread)
  });
};
