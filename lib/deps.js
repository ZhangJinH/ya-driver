/**
 * Dependencies install
 */
const install = require('yarn-install');

module.exports = function (options) {
  const projectPath = options.projectPath;
  install({
    cwd: projectPath
  });
};
