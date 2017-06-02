exports.up = async function(knex, Promise) {
  await knex.schema.table('ip_profiles', t => {
    t.boolean('email_notification').defaultTo(true);
  });

  return await knex.schema.table('sp_profiles', t => {
    t.boolean('email_notification').defaultTo(true);
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.table('ip_profiles', t => {
    t.dropColumn('email_notification');
  });

  return await knex.schema.table('sp_profiles', t => {
    t.dropColumn('email_notification');
  });
};
