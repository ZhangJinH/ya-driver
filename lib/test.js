/**
 * Run unit test drive by karma
 */

const Project = require('./project');
const opn = require('opn');
const Server = require('karma').Server;
const glob = require('glob');
const fsExtra = require('fs-extra');
// const {
//   merge
// } = require('lodash');
const {
  log,
  warn
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
    coveragePath,
    srcPath
  } = project;
  const karmaConfig = getKarmaConfig(options);
  // 判断是否存在test文件
  if (karmaConfig.files.every(({ pattern }) => {
    const result = glob.sync(pattern, {
      cwd: srcPath
    });
    return !result.length;
  })) {
    warn(`There is no test file exist, exit with 0 code.`);
    fsExtra.emptyDirSync(coveragePath); // Empty report directory
    processSendSilent({
      action: 'complete'
    });
    return;
  }
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
  var compileCounts = 0;
  server.on('run_complete', function (browser, {
    success,
    failed,
    exitCode
  }) {
    compileCounts++;
    if (exitCode !== 0) {
      log(`\nThere are some case not passed，success(${success}), failed(${failed})`);
    }
    if (ipcEnabled) {
      log(`请切换到 Code coverage 面板查看详细`);
      if (compileCounts === 1) {
        processSendSilent({
          action: 'complete'
        });
      }
    }
  });
  server.start();
};
