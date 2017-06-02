const seeds = require('./data/ip_profiles');

exports.seed = async (knex, Promise) => {
  const IpProfile = require('../../models/ip_profile')(knex);
  return await Promise.all(seeds.map(seed => IpProfile.create(seed)));
};
