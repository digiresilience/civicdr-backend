const R = require('ramda');
const defined = require('defined');
const xtend = require('xtend');

let userAllowedReadKeys = [
  'id',
  'status',
  'ticket_ip_contact',
  'ticket_ip_name',
  'ticket_sp_contact',
  'ticket_sp_name',
  'date_of_incident',
  'incident_type',
  'description',
  'steps_taken',
  'created_at',
  'updated_at',
  'ip_assigned_id',
  'sp_assigned_id'
];

module.exports = Ticket => {
  return async (req, res) => {
    /* If the reading user is an IP or an SP
     * Filter the tickets by the ip_assigned_id or sp_assigned_id
     * Don't ask for groupings
     */
    let withGroupings = req.user.role === 'admin';

    let filter = {};
    let id = req.user.profile.id;
    if (req.user.role === 'ip') {
      filter = { type: 'ip_assigned_id', val: id };
    } else if (req.user.role === 'sp') {
      filter = { type: 'sp_assigned_id', val: id };
    }

    let tickets = await Ticket.find({ withGroupings, filter });
    tickets = await Promise.all(
      tickets.map(async ticket => {
        let notify = await Ticket.shouldNotify(
          ticket.id,
          ticket.updated_at,
          req.user
        );
        return xtend(ticket, { notify });
      })
    );

    res.status(200).json(tickets);
  };
};
