exports.seed = async (knex, Promise) => {
  await knex('ip_profiles').del();
  await knex('sp_profiles').del();
  await knex('tickets_groupings').del();
  await knex('groupings').del();
  await knex('messages').del();
  await knex('threads').del();
  return await knex('tickets').del();
};
