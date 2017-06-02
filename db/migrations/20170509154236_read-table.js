exports.up = async function(knex, Promise) {
  try {
    return await knex.schema.createTable('reads', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('ticket_id');
      table.uuid('user_id').nullable();
      table.string('user_type');
      table.dateTime('read_at');
    });
  } catch (e) {
    console.error(e);
  }
};

exports.down = async function(knex, Promise) {
  try {
    return await knex.schema.dropTable('reads');
  } catch (e) {
    console.error(e);
  }
};
