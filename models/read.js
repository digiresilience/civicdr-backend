const xtend = require('xtend');
const defined = require('defined');
const has = require('has');
const R = require('ramda');
const { RecordNotFound, NotNullViolation } = require('../errors');

module.exports = conn => {
  async function getRead(ticket_id, user) {
    return await conn('reads')
      .where('ticket_id', ticket_id)
      .where('user_id', user.role === 'admin' ? null : user.profile.id)
      .where('user_type', user.role)
      .select();
  }

  return {
    getRead,

    updateRead: async (ticket_id, user) => {
      let [read] = await getRead(ticket_id, user);

      if (defined(read)) {
        let dataToUpdate = xtend(read, {
          read_at: conn.fn.now()
        });
        await conn('reads').where('id', read.id).update(dataToUpdate);
      } else {
        await conn('reads').insert({
          ticket_id,
          user_id: user.role === 'admin' ? null : user.profile.id,
          user_type: user.role,
          read_at: conn.fn.now()
        });
      }
    }
  };
};
