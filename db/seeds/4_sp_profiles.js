const seeds = require('./data/sp_profiles');
const R = require('ramda');
const { pickone } = require('../../utils/misc');

exports.seed = async (knex, Promise) => {
  const SpProfile = require('../../models/sp_profile')(knex);
  const Ticket = require('../../models/ticket')(knex);
  let profile_ids = await Promise.all(
    seeds.map(seed => SpProfile.create(seed))
  );

  /* Assign some profiles to tickets */
  let tickets = await Ticket.find();
  profile_ids = R.flatten(profile_ids);
  return await Promise.all(
    tickets.map(ticket => {
      let id = pickone(profile_ids);
      return Ticket.assignSpProfile(ticket.id, id);
    })
  );
};
