exports.up = async function(knex, Promise) {
  return await knex.schema.table('groupings', t => {
    t.text('description').nullable().alter();
  });
};

exports.down = async function(knex, Promise) {
  return await knex.schema.table('groupings', t => {
    t.text('description').notNullable().defaultTo('').alter();
  });
};
