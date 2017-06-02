exports.up = async function(knex, Promise) {
  try {
    return await knex.schema.createTable('emails', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('email');
      table.boolean('sent');
      table.timestamps(true);
    });
  } catch (e) {
    console.error(e);
  }
};

exports.down = async function(knex, Promise) {
  try {
    return await knex.schema.dropTable('emails');
  } catch (e) {
    console.error(e);
  }
};
