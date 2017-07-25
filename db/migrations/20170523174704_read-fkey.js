exports.up = async function(knex, Promise) {
  return await knex.schema.table('reads', t => {
    t.uuid('ticket_id').references('id').inTable('tickets').alter();
  });
};

exports.down = async function(knex, Promise) {
  return await knex.schema.table('reads', t => {
    t.dropForeign('ticket_id');
  });
};
