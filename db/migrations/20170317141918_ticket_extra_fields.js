exports.up = async function(knex, Promise) {
  return await knex.schema.table('tickets', t => {
    t.string('ip_assigned');
    t.string('sp_assigned');
  });
};

exports.down = async function(knex, Promise) {
  return await knex.schema.table('tickets', t => {
    t.dropColumn('ip_assigned');
    t.dropColumn('sp_assigned');
  });
};
