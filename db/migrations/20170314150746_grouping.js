exports.up = async function(knex, Promise) {
  try {
    await knex.schema.createTable('groupings', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('title');
      table.text('description');
      table.timestamps(true);
    });

    return await knex.schema.createTable('tickets_groupings', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('ticket_id').references('id').inTable('tickets');
      table.uuid('grouping_id').references('id').inTable('groupings');
      table.timestamps(true);
    });
  } catch (e) {
    console.error(e);
  }
};

exports.down = async function(knex, Promise) {
  try {
    await knex.dropTable('tickets_groupings');
    return await knex.dropTable('groupings');
  } catch (e) {
    console.error(e);
  }
};
