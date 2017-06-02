const R = require('ramda');
const defined = require('defined');

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
  'created_by',
  'ip_assigned_id',
  'sp_assigned_id',
  'notify'
];

module.exports = Ticket => {
  return async (req, res) => {
    /* TODO: validate input */
    let id = req.params.id;

    let [ticket] = await Ticket.findById(id);

    /* If the reading user is an IP or SP
     * - Remove keys that they're not allowed to read
     */
    if (req.user.role === 'ip' || req.user.role === 'sp') {
      ticket = R.pick(userAllowedReadKeys, ticket);
    }

    if (defined(ticket)) {
      ticket.notify = await Ticket.shouldNotify(
        id,
        ticket.updated_at,
        req.user
      );
      await Ticket.updateRead(id, req.user);
      res.status(200).json(ticket);
    } else {
      res.boom.notFound('That ticket does not exist');
    }
  };
};
