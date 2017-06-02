const seeds = require('./data/tickets');
const { pickone } = require('../../utils/misc');
const xtend = require('xtend');

exports.seed = async (knex, Promise) => {
  const Ticket = require('../../models/ticket')(knex);
  const ip_profiles = await knex('ip_profiles').select();

  let user = {
    email: 'seed',
    profile: { id: 0, name: 'Admin' },
    role: 'admin'
  };

  return await Promise.all(
    seeds.map(seed => {
      let ip = pickone(ip_profiles).id;
      return Ticket.create(
        xtend(seed, {
          ip_assigned_id: ip
        }),
        user.profile.name
      );
    })
  );
};
