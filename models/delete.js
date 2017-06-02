const { RecordNotFound } = require('../errors');

module.exports = conn => {
  const Ticket = require('./ticket')(conn);
  const IpProfile = require('./ip_profile')(conn);
  const SpProfile = require('./sp_profile')(conn);
  const defined = require('defined');

  return {
    // Delete all the associated tickets
    deleteIp: async id => {
      let [profile] = await IpProfile.findById(id);
      if (!defined(profile)) {
        throw new RecordNotFound('profile not found');
      }

      // Ideally this should be in a transaction, but
      // nested transaction handling would require
      // some rewrite of the ticket delete method
      await Ticket.deleteForProfile(id, 'ip');
      return await conn('ip_profiles').where('id', id).delete();
    },

    // Unassign the SP from associated tickets
    deleteSp: async id => {
      let [profile] = await SpProfile.findById(id);
      if (!defined(profile)) {
        throw new RecordNotFound('profile not found');
      }

      let tickets = await conn('tickets').where('sp_assigned_id', id);

      await Promise.all(
        tickets.map(ticket => Ticket.unassignSpProfile(ticket.id, id))
      );
      return await conn('sp_profiles').where('id', id).delete();
    }
  };
};
