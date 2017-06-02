const defined = require('defined');

/** read:tickets
 * An IP or an SP should have an existing profile
 */
module.exports = conn => {
  return async ({ user }) => {
    return defined(user.profile);
  };
};
