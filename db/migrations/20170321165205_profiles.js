exports.up = async function(knex, Promise) {
  try {
    await knex.schema.createTable('sp_profiles', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('email');
      table.string('name');
      table.specificType('services', 'text[]');
      table.text('description');
      table.string('contact');
      table.specificType('secure_channels', 'text[]');
      table.text('fees');
      table.specificType('languages', 'text[]');
      table.text('pgp_key');
      table.integer('rating');
      table.string('start_time');
      table.string('per_week_availability');
      table.timestamps(true);
    });
    await knex.schema.createTable('ip_profiles', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('email');
      table.string('name');
      table.string('contact');
      table.text('location');
      table.specificType('secure_channels', 'text[]');
      table.specificType('languages', 'text[]');
      table.specificType('notification_prefs', 'text[]');
      table.specificType('types_of_work', 'text[]');
      table.text('pgp_key');
      table.text('internal_level');
      table.timestamps(true);
    });

    return await knex.schema.table('tickets', t => {
      t
        .uuid('ip_assigned_id')
        .references('id')
        .inTable('ip_profiles')
        .onDelete('SET NULL');
      t.dropColumn('ip_assigned');
      t
        .uuid('sp_assigned_id')
        .references('id')
        .inTable('sp_profiles')
        .onDelete('SET NULL');
      t.dropColumn('sp_assigned');
    });
  } catch (e) {
    console.error(e);
  }
};

exports.down = async function(knex, Promise) {
  try {
    await knex.schema.table('tickets', t => {
      t.dropColumn('ip_assigned_id');
      t.dropColumn('sp_assigned_id');
      t.string('ip_assigned');
      t.string('sp_assigned');
    });
    await knex.schema.dropTable('sp_profiles');
    return await knex.schema.dropTable('ip_profiles');
  } catch (e) {
    console.error(e);
  }
};
