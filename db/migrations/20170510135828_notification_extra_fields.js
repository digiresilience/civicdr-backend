exports.up = async function(knex, Promise) {
  return await knex.schema.table('ip_profiles', t => {
    t
      .specificType('notification_languages', 'text[]')
      .notNullable()
      .defaultTo('{English}');
  });
};

exports.down = async function(knex, Promise) {
  return await knex.schema.table('ip_profiles', t => {
    t.dropColumn('notification_languages');
  });
};
