const { RecordNotFound } = require('../errors');
const defined = require('defined');

/** update:ticket
 * An IP or an SP can read the ticket that they are assigned to
 */
module.exports = conn => {
  const Ticket = require('../models/ticket')(conn);

  return async ({ user, params }) => {
    let ticket_id = params.id || params.ticket_id;
    try {
      let [ticket] = await Ticket.findById(ticket_id);

      if (!defined(ticket)) {
        throw new RecordNotFound(user, ticket_id);
      }

      let { ip_assigned_id, sp_assigned_id } = ticket;
      if (user.role === 'ip') {
        return ip_assigned_id === user.profile.id;
      }
      if (user.role === 'sp') {
        return sp_assigned_id === user.profile.id;
      }
    } catch (e) {
      if (!(e instanceof RecordNotFound)) {
        console.error(e);
      }
      return false;
    }
  };
};
