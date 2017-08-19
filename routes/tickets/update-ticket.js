const xtend = require('xtend');
const R = require('ramda');
const has = require('has');
const { RecordNotFound } = require('../../errors');

let ipAllowedUpdateKeys = [
  'ticket_ip_contact',
  'ticket_ip_name',
  'date_of_incident',
  'incident_type',
  'description',
  'steps_taken'
];

let spAllowedUpdateKeys = ['ticket_sp_contact', 'ticket_sp_name'];

module.exports = (Ticket, Email) => {
  return async (req, res) => {
    /* TODO: validate input */
    let data = req.body;

    let id = req.params.id;

    /* If the updating user is an IP or SP
     * - Remove keys that they're not allowed to submit
     */
    if (req.user.role === 'ip') {
      data = R.pick(ipAllowedUpdateKeys, data);
    }
    if (req.user.role === 'sp') {
      data = R.pick(spAllowedUpdateKeys, data);
    }

    /* Save data to  db */
    try {
      await Ticket.update(id, data, req.user.profile.name);

      // if status was updated, email IP/SP
      if (has(data, 'status')) {
        let [ticket] = await Ticket.findById(id);
        if (ticket.ticket_ip_contact && req.user.role !== 'ip') {
          await Email.notify(
            ticket.ticket_ip_contact,
            ticket.ip_assigned_id,
            'ip',
            'UpdatedTicket'
          );
        }
        if (ticket.ticket_sp_contact && req.user.role !== 'sp') {
          await Email.notify(
            ticket.ticket_sp_contact,
            ticket.sp_assigned_id,
            'sp',
            'UpdatedTicket'
          );
        }
        if (req.user.role !== 'admin') {
          await Email.notifyAdmin('UpdatedTicket');
        }
      }

      Ticket.updateRead(id, req.user);
      res.status(200).send('Success');
    } catch (e) {
      if (e instanceof RecordNotFound) {
        return res.boom.badRequest(e.message);
      } else {
        throw e;
      }
    }
  };
};
