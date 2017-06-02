exports.up = async function(knex, Promise) {
  try {
    await knex.schema.table('ip_profiles', t => {
      t.renameColumn('email', 'openid');
    });
    return await knex.schema.table('sp_profiles', t => {
      t.renameColumn('email', 'openid');
    });
  } catch (e) {
    console.error(e);
  }
};

exports.down = async function(knex, Promise) {
  try {
    await knex.schema.table('ip_profiles', t => {
      t.renameColumn('openid', 'email');
    });
    return await knex.schema.table('sp_profiles', t => {
      t.renameColumn('openid', 'email');
    });
  } catch (e) {
    console.error(e);
  }
};
