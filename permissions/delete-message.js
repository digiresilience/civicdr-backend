const { RecordNotFound } = require('../errors');
const defined = require('defined');

/** delete:message
 * An IP or an SP can delete their own messages
 */
module.exports = conn => {
  return async ({ user, params }) => {
    let message_id = params.id;

    let [{ created_by }] = await conn('messages')
      .select('created_by')
      .where('id', message_id);

    return created_by === user.profile.id;
  };
};
