const xtend = require('xtend');
const R = require('ramda');
const { RecordNotFound, NotNullViolation } = require('../../errors');

module.exports = (Ticket, IpProfile) => {
  return async (req, res) => {
    /* TODO: validate input */
    let data = req.body;

    try {
      let ip_id = req.params.profile_id;

      // Grab ticket and reassign ip_assigned_id
      let [ticket] = await Ticket.findById(req.params.ticket_id);

      if (!ticket) {
        throw new RecordNotFound('Ticket does not exist');
      }

      let [profile] = await IpProfile.findById(ip_id);

      if (!profile) {
        throw new RecordNotFound('IP does not exist');
      }

      delete ticket.id;
      delete ticket.sp_assigned_id;
      delete ticket.ticket_sp_contact;
      delete ticket.ticket_sp_name;

      data = xtend(ticket, {
        ip_assigned_id: ip_id,
        ticket_ip_contact: profile.contact,
        ticket_ip_name: profile.name,
        status: 'unassigned'
      });

      // Create ticket
      let [id] = await Ticket.create(data, req.user.profile.name);

      // Add groupings
      ticket.groupings.forEach(async grouping => {
        await Ticket.addGrouping(id, grouping.grouping_id);
      });

      // Return
      await Ticket.updateRead(id, req.user);
      res.status(200).json([id]);
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
