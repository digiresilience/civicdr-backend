exports.up = async function(knex, Promise) {
  await knex.schema.table('tickets', t => {
    t.string('status').notNullable().alter();
    t.text('description').notNullable().alter();
    t.date('date_of_incident').notNullable().alter();
    t.string('ticket_ip_name').notNullable().alter();
    t.string('ticket_ip_contact').notNullable().alter();
    t.text('steps_taken').notNullable().alter();
    t.uuid('ip_assigned_id').notNullable().alter();
    t.specificType('incident_type', 'text[]').notNullable().alter();
  });

  await knex.schema.table('ip_profiles', t => {
    t.string('contact').notNullable().alter();
    t.string('name').notNullable().alter();
    t.specificType('notification_prefs', 'text[]').notNullable().alter();
    t.specificType('languages', 'text[]').notNullable().alter();
    t.specificType('secure_channels', 'text[]').notNullable().alter();
  });

  await knex.schema.table('sp_profiles', t => {
    t.string('contact').notNullable().alter();
    t.string('name').notNullable().alter();
    t.specificType('services', 'text[]').notNullable().alter();
    t.specificType('secure_channels', 'text[]').notNullable().alter();
    t.specificType('languages', 'text[]').notNullable().alter();
    t.text('fees').notNullable().alter();
  });

  await knex.schema.table('groupings', t => {
    t.string('title').notNullable().alter();
    t.text('description').notNullable().alter();
  });

  return await knex.schema.table('messages', t => {
    t.text('content').notNullable().alter();
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.table('tickets', t => {
    t.string('status').alter();
    t.text('description').alter();
    t.date('date_of_incident').alter();
    t.string('ticket_ip_name').alter();
    t.string('ticket_ip_contact').alter();
    t.text('steps_taken').alter();
    t.uuid('ip_assigned_id').alter();
    t.specificType('incident_type', 'text[]').alter();
  });

  await knex.schema.table('ip_profiles', t => {
    t.string('contact').alter();
    t.string('name').alter();
    t.specificType('notification_prefs', 'text[]').alter();
    t.specificType('languages', 'text[]').alter();
    t.specificType('secure_channels', 'text[]').alter();
  });

  await knex.schema.table('sp_profiles', t => {
    t.string('contact').alter();
    t.string('name').alter();
    t.specificType('services', 'text[]').alter();
    t.specificType('secure_channels', 'text[]').alter();
    t.specificType('languages', 'text[]').alter();
    t.text('fees').alter();
  });

  await knex.schema.table('groupings', t => {
    t.string('title').alter();
    t.text('description').alter();
  });

  return await knex.schema.table('messages', t => {
    t.text('content').alter();
  });
};
