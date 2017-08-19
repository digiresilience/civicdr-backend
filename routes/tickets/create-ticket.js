const xtend = require('xtend');
const R = require('ramda');
const { NotNullViolation } = require('../../errors');

let ipAllowedCreateKeys = [
  'ticket_ip_contact',
  'ticket_ip_name',
  'date_of_incident',
  'incident_type',
  'description',
  'steps_taken',
  'title'
];

module.exports = (Ticket, Email, IpProfile) => {
  return async (req, res) => {
    let data = req.body;
    const hasData = R.has(R.__, data);

    /* If the creating user is an IP
     * - Assign the ticket to the IP
     * - Remove keys that they're not allowed to submit
     * Assign the variable ip_assigned id
     */
    let ip_asssigned_id;
    if (req.user.role === 'ip') {
      ip_assigned_id = req.user.profile.id;
      data = R.pick(ipAllowedCreateKeys, data);
      data = xtend(data, {
        ip_assigned_id: req.user.profile.id,
        status: 'unassigned'
      });
    } else {
      if (!hasData('ip_assigned_id')) {
        return res.boom.badData('Undefined IP');
      }
      ip_assigned_id = data.ip_assigned_id;
    }

    /* Validate the ip id */
    const [profile] = await IpProfile.findById(ip_assigned_id);
    if (R.isNil(profile)) {
      return res.boom.badData('That IP does not exist');
    }

    /* If ticket_ip_name and ticket_ip_contact
     * are not specified, fill them from the IP
     * profile table
     */
    if (!hasData('ticket_ip_contact') || !hasData('ticket_ip_name')) {
      data.ticket_ip_contact = data.ticket_ip_contact || profile.contact;
      data.ticket_ip_name = data.ticket_ip_name || profile.name;
    }

    /* Save data to db */
    try {
      let id = await Ticket.create(data, req.user.profile.name);
      Ticket.updateRead(id[0], req.user);

      // Get ticket info using its id
      let [ticket] = await Ticket.findById(id[0]);
      // Notify IP if ticket created by admin
      if (ticket.ticket_ip_contact && req.user.role !== 'ip') {
        await Email.notify(
          ticket.ticket_ip_contact,
          ticket.ip_assigned_id,
          'ip',
          'newTicket'
        );
        // Notify Admin if ticket created by IP
      } else if (req.user.role === 'ip') {
        await Email.notifyAdmin('newTicket');
      }

      res.status(200).json(id);
    } catch (e) {
      if (e instanceof NotNullViolation) {
        return res.boom.badData(e.message);
      } else {
        throw e;
      }
    }
  };
};
