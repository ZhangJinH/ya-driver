/**
 * Record or print log info
 */
function log (...args) {
  console.log(...args);
};
function error (...args) {
  console.error(...args);
};
module.exports = {
  log,
  error
};
