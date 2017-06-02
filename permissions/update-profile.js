const defined = require('defined');

/** read:ticket
 * An IP or an SP can read and update their own profile
 */
module.exports = conn => {
  return async ({ user, params }) => {
    return defined(user.profile) && user.profile.id === params.id;
  };
};
