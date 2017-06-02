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
      if (
        ticket &&
        ticket.ticket_ip_contact &&
        thread.type === 'ip' &&
        req.user.role === 'admin'
      ) {
        await Email.notify(ticket.ticket_ip_contact, thread.participant, 'ip');
      }

      if (
        ticket &&
        ticket.ticket_sp_contact &&
        thread.type === 'sp' &&
        req.user.role === 'admin'
      ) {
        await Email.notify(ticket.ticket_sp_contact, thread.participant, 'sp');
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
