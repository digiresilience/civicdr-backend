const defined = require('defined');
const RecordNotFound = require('../../errors').RecordNotFound;
const has = require('has');
const withError = require('../../utils/with-error');

module.exports = conn => {
  const Ticket = require('../../models/ticket.js')(conn);
  const Email = require('../../models/email.js')(conn);
  const IpProfile = require('../../models/ip_profile')(conn);
  const SpProfile = require('../../models/sp_profile')(conn);

  let routes = {
    createTicket: require('./create-ticket')(Ticket, Email, IpProfile),
    getTicket: require('./read-ticket')(Ticket),
    getTickets: require('./read-tickets')(Ticket),
    updateTicket: require('./update-ticket')(Ticket, Email),
    duplicateTicket: require('./duplicate-ticket')(Ticket, IpProfile),

    addGrouping: async (req, res) => {
      let id = req.params.id;
      let grouping_id = req.params.grouping_id;
      try {
        await Ticket.addGrouping(id, grouping_id);
        Ticket.updateRead(id, req.user);
        res.status(200).send('Success');
      } catch (e) {
        if (e instanceof RecordNotFound) {
          return res.boom.badRequest(e.message);
        } else {
          throw e;
        }
      }
    },

    deleteGrouping: async (req, res) => {
      let id = req.params.id;
      let grouping_id = req.params.grouping_id;
      try {
        await Ticket.deleteGrouping(id, grouping_id);
        Ticket.updateRead(id, req.user);
        res.status(200).send('Success');
      } catch (e) {
        if (e instanceof RecordNotFound) {
          return res.boom.badRequest(e.message);
        } else {
          throw e;
        }
      }
    },

    deleteTicket: async (req, res) => {
      /* TODO validate id */
      let id = req.params.id;

      try {
        await Ticket.delete(id);
        res.status(200).send('Success');
      } catch (e) {
        if (e instanceof RecordNotFound) {
          res.boom.badRequest(e.message);
        } else {
          throw e;
        }
      }
    },

    assignSpProfile: require('./assign-profile')(Ticket, Email, SpProfile),

    unassignSpProfile: async (req, res) => {
      /* TODO validate id */
      let id = req.params.id;
      let profile_id = req.params.profile_id;
      try {
        await Ticket.unassignSpProfile(id, profile_id);
        Ticket.updateRead(id, req.user);
        res.status(200).send('Success');
      } catch (e) {
        if (e instanceof RecordNotFound) {
          return res.boom.badRequest(e.message);
        } else {
          throw e;
        }
      }
    }
  };

  return withError(routes);
};
