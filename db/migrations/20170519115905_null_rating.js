exports.up = async function(knex, Promise) {
  let profiles = await knex('sp_profiles').whereNull('rating');
  await Promise.all(
    profiles.map(profile => {
      return knex('sp_profiles').where('id', profile.id).update({ rating: 0 });
    })
  );
  await knex.schema.table('sp_profiles', t => {
    t.integer('rating').defaultTo(0).notNullable().alter();
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.table('sp_profiles', t => {
    t.integer('rating').nullable().alter();
  });
};
