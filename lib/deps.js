/**
 * Dependencies install
 */
const install = require('yarn-install');
const {
  processSendSilent
} = require('../utils/helper');

module.exports = function (options) {
  const projectPath = options.projectPath;
  install({
    cwd: projectPath
  });
  processSendSilent({
    action: 'deps'
  });
};
