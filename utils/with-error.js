/* Wraps route handlers that use async/await
 * with Promise catch for generic error handling
 */

const withError = fn => (...args) => fn(...args).catch(args[2]);
const R = require('ramda');

module.exports = R.map(fn => withError(fn));
