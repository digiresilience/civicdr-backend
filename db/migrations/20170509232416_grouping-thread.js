exports.up = async function(knex, Promise) {
  try {
    return await knex.schema.table('threads', table => {
      table.uuid('grouping_id').references('id').inTable('groupings');
    });
  } catch (e) {
    console.error(e);
  }
};

exports.down = async function(knex, Promise) {
  try {
    return await knex.schema.table('threads', table => {
      table.dropColumn('grouping_id');
    });
  } catch (e) {
    console.error(e);
  }
};
