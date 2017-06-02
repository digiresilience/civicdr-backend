const { RecordNotFound } = require('../errors');
const defined = require('defined');

/** rw:thread
 * An IP or an SP can read threads joined to tickets
 * they're assigned
 */
module.exports = conn => {
  return async ({ user, params }) => {
    let thread_id = params.id;

    let [{ ticket_id, participant }] = await conn('threads')
      .select('ticket_id', 'participant')
      .where('id', thread_id);

    let [ticket] = await conn('tickets').where('id', ticket_id);

    if (!defined(ticket)) {
      return false;
    }

    let { ip_assigned_id, sp_assigned_id } = ticket;
    let user_id = user.profile.id;
    if (user.role === 'ip') {
      return ip_assigned_id === user_id && user_id === participant;
    }
    if (user.role === 'sp') {
      return sp_assigned_id === user_id && user_id === participant;
    }
    return false;
  };
};
