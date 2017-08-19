exports.up = async function(knex, Promise) {
  await knex.raw('CREATE SEQUENCE ticket_titles START 101;');

  return await knex.schema.table('tickets', t => {
    t.string('title');
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.table('tickets', t => {
    t.dropColumn('title');
  });
  return await knex.raw('DROP SEQUENCE ticket_titles;');
};
