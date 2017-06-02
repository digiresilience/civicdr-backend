exports.up = async function(knex, Promise) {
  return await knex.schema.table('tickets', t => {
    t.renameColumn('ip_contact', 'ticket_ip_contact');
    t.string('ticket_ip_name');
    t.string('ticket_sp_contact');
    t.string('ticket_sp_name');
  });
};

exports.down = async function(knex, Promise) {
  return await knex.schema.table('tickets', t => {
    t.renameColumn('ticket_ip_contact', 'ip_contact');
    t.dropColumn('ticket_ip_name');
    t.dropColumn('ticket_sp_contact');
    t.dropColumn('ticket_sp_name');
  });
};
