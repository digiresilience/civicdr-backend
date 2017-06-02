const xtend = require('xtend');
const R = require('ramda');
const { NotNullViolation } = require('../../errors');

let ipAllowedCreateKeys = [
  'ticket_ip_contact',
  'ticket_ip_name',
  'date_of_incident',
  'incident_type',
  'description',
  'steps_taken'
];

module.exports = Ticket => {
  return async (req, res) => {
    /* TODO: validate input */
    let data = req.body;

    /* If the creating user is an IP
     * - Assign the ticket to the IP
     * - Remove keys that they're not allowed to submit
     */
    if (req.user.role === 'ip') {
      data = R.pick(ipAllowedCreateKeys, data);
      data = xtend(data, {
        ip_assigned_id: req.user.profile.id,
        status: 'unassigned'
      });
    }

    /* Save data to db */
    try {
      let id = await Ticket.create(data, req.user.profile.name);
      Ticket.updateRead(id[0], req.user);
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
