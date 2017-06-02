exports.up = async function(knex, Promise) {
  try {
    await knex.schema.createTable('threads', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('ticket_id').references('id').inTable('tickets');
      table.string('type');
      table.uuid('participant');
      table.string('status').defaultsTo('active');
      table.timestamps(true, true);
    });

    return await knex.schema.createTable('messages', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('thread_id').references('id').inTable('threads');
      table.uuid('created_by');
      table.text('content');
      table.timestamps(true, true);
    });
  } catch (e) {
    console.error(e);
  }
};

exports.down = async function(knex, Promise) {
  try {
    await knex.dropTable('threads');
    return await knex.dropTable('messages');
  } catch (e) {
    console.error(e);
  }
};
