/**
 *  Generate project template
 */
const gitDownloader = require('download-git-repo');
const fsExtra = require('fs-extra');
const chalk = require('chalk');
const waiting = require('../utils/waiting');
const {
  log,
  error
} = require('../utils/log');
const {
  templateUri
} = require('../config/vars');
const {
  processSendSilent
} = require('../utils/helper');

module.exports = {
  async generator (options) {
    options = {
      ...options
    };
    const {
      projectPath
    } = options;
    // ensure project path exist
    fsExtra.ensureDirSync(projectPath);
    waiting.start('Waiting from downloading');
    return new Promise((resolve) => {
      gitDownloader(templateUri, projectPath, function (err) {
        waiting.stop(); // First clear console
        if (err) {
          error(` From github ${chalk.green(templateUri)} download template failure.`);
          processSendSilent({
            action: 'created',
            data: false
          });
          resolve(false);
        } else {
          log(` From github ${chalk.green(templateUri)} download template success.`);
          processSendSilent({
            action: 'created',
            data: true
          });
          resolve(true);
        }
      });
    });
  }
};
