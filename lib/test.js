/**
 * Run unit test drive by karma
 */

const Project = require('./project');
const opn = require('opn');
const Server = require('karma').Server;
// const {
//   merge
// } = require('lodash');
const {
  log
  // error
} = require('../utils/log');
const {
  ipcEnabled,
  processSendSilent
} = require('../utils/helper');
const getKarmaConfig = require('../config/karma');

module.exports = function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  const {
    coveragePath
  } = project;
  const karmaConfig = getKarmaConfig(options);
  // console.log('config', karmaConfig);
  const server = new Server(karmaConfig, function (exitCode) {
    log('Unit test(Karma) run complete return ' + exitCode);
    if (!ipcEnabled) {
      const uri = `file://${coveragePath}/${karmaConfig.coverageReporter.subdir}/index.html`;
      opn(uri);
    } else {
      processSendSilent({
        action: 'complete'
      });
      process.exit(exitCode);
    }
  });
  log(`Start run test runner...`);
  // server.on('run_complete', function (browser, result) {
  //   console.log('Covrage report: ', result)
  // })
  server.start();
};
