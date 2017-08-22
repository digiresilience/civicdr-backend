exports.up = async function(knex, Promise) {
  await knex.schema.table('ip_profiles', t => {
    t.boolean('partner_agreement').defaultTo(false);
  });

  await knex.schema.table('ip_profiles', t => {
    t.boolean('code_of_practice').defaultTo(false);
  });

  return await knex.schema.table('sp_profiles', t => {
    t.boolean('code_of_practice').defaultTo(false);
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.table('ip_profiles', t => {
    t.dropColumn('partner_agreement');
  });

  await knex.schema.table('ip_profiles', t => {
    t.dropColumn('code_of_practice');
  });

  return await knex.schema.table('sp_profiles', t => {
    t.dropColumn('code_of_practice');
  });
};
