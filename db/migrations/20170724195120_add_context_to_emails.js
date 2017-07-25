exports.up = async function(knex, Promise) {
  return await knex.schema.table('emails', t => {
    t.string('context');
  });
};

exports.down = async function(knex, Promise) {
  return await knex.schema.table('emails', t => {
    t.dropColumn('context');
  });
};
