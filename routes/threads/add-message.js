const { RecordNotFound, NotNullViolation } = require('../../errors');
const R = require('ramda');

const userAllowedMessageKeys = ['content'];

module.exports = (Thread, Ticket, Email) => {
  return async (req, res) => {
    let id = req.params.id;
    const userID = req.user.role === 'admin' ? null : req.user.profile.id;

    try {
      let message = await Thread.addMessage(
        R.pick(userAllowedMessageKeys, req.body),
        id,
        userID
      );

      // send emails on certain thread updates
      let [thread] = await Thread.findById(id);
      let [ticket] = await Ticket.findById(thread.ticket_id);
      // IP Message Thread Notifications
      if (
        ticket &&
        ticket.ticket_ip_contact &&
        thread.type === 'ip'
      ) {
        // Notify IP when admin sends a message
        if (req.user.role === 'admin') {
          await Email.notify(ticket.ticket_ip_contact, thread.participant, 'ip', 'message');
          // Notify Admin when IP sends a message
        } else if (req.user.role === 'ip') {
          await Email.notifyAdmin('message');
        }
      }
      // SP Message Thread Notifications
      if (
        ticket &&
        ticket.ticket_sp_contact &&
        thread.type === 'sp'
      ) {
        // Notify SP when admin sends a message
        if (req.user.role === 'admin') {
          await Email.notify(ticket.ticket_sp_contact, thread.participant, 'sp', 'message');
          // Notify Admin when SP sends a message
        } else if (req.user.role === 'sp') {
          await Email.notifyAdmin('message');
        }
      }

      Thread.updateRead(id, req.user);
      res.status(200).send(message);
    } catch (e) {
      if (e instanceof RecordNotFound) {
        return res.boom.badRequest(e.message);
      } else if (e instanceof NotNullViolation) {
        return res.boom.badData(e.message);
      } else {
        throw e;
      }
    }
  };
};
