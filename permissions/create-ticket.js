/** create:ticket
 * Only IPs can create tickets
 */
module.exports = conn => {
  return async ({ user }) => {
    return user.role === 'ip';
  };
};
