exports.up = async function(knex, Promise) {
  await knex.schema.table('tickets', t => {
    t.dropColumn('incident_type');
  });
  return await knex.schema.table('tickets', t => {
    t.specificType('incident_type', 'text[]');
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.table('tickets', t => {
    t.dropColumn('incident_type');
  });
  return await knex.schema.table('tickets', t => {
    t.string('incident_type');
  });
};
