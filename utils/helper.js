/**
 * Some helper utils
 */

module.exports = {
  processSendSilent(data) {
    return process.send && process.send(data);
  },
  ipcEnabled() {
    return !!process.send;
  }
};