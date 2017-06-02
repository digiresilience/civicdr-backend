exports.up = async function(knex, Promise) {
  try {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    await knex.raw('CREATE SEQUENCE ticket_titles START 101;');
    return await knex.schema.createTable('tickets', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.integer('title');
      table.string('status');
      table.string('ip_contact');
      table.date('date_of_incident');
      table.string('incident_type');
      table.text('description');
      table.text('steps_taken');
      table.string('created_by');
      table.string('updated_by');
      table.timestamps(true);
    });
  } catch (e) {
    console.error(e);
  }
};

exports.down = async function(knex, Promise) {
  try {
    await knex.schema.dropTable('tickets');
    return await knex.raw('DROP EXTENSION pgcrypto;');
  } catch (e) {
    console.error(e);
  }
};
