const { RecordNotFound } = require('../../errors');

module.exports = (Ticket, Email, SpProfile) => {
  return async (req, res) => {
    /* TODO validate id */
    let id = req.params.id;
    let profile_id = req.params.profile_id;

    try {
      await Ticket.assignSpProfile(id, profile_id);
      // conditionally add email
      // since it has just been reassigned, use sp profile contact instead of
      // the ticket_sp_contact
      let [sp_profile] = await SpProfile.findById(profile_id);
      if (sp_profile.contact) {
        await Email.notify(sp_profile.contact, profile_id, 'sp');
      }

      // acknowledge the ticket has been read
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
