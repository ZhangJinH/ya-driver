/**
 * Create project template
 */
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer');
const waiting = require('../utils/waiting');
const {
  ready
} = require('../utils/check-env');
const { log, error } = require('../utils/log');
const { getPkgJson, getLatestVersion } = require('../utils/get-self-meta');
const {
  generator
} = require('./template');

// package.json
const pkgJson = getPkgJson();
const pkgName = pkgJson.name.toUpperCase();

module.exports = async function (options) {
  options = {
    ...options
  };
  log('create options', options);
  log(chalk.greenBright(figlet.textSync(pkgJson.name, {
    font: 'Ghost'
  })));
  const currentVersion = pkgJson.version;
  const onlineVersion = await getLatestVersion();
  if (currentVersion === onlineVersion) {
    log(` ${chalk.green(pkgName)} at ${chalk.green(currentVersion)} is the latest.`);
  } else {
    log(` ${chalk.green(pkgName)} with local ${chalk.green(currentVersion)}is not the same compare with the remote<${chalk.green(onlineVersion)}>，maybe need a upgrade.`);
  }
  // Check envs
  log(`${chalk.yellowBright('Check the CMD environment:')}`);
  const {
    envCommands,
    preferInstallCMD
  } = ready();
  log(` The prefer install command is ${chalk.green(preferInstallCMD)}`);
  log(`${chalk.yellowBright('Environment check result:')}`);
  log(JSON.stringify(envCommands, '', 2));
  if (!preferInstallCMD) {
    error('Please install yarn or npm first.');
    return; // Abort
  }
  // make path
  const { projectPath } = options;
  if (fs.existsSync(projectPath)) {
    const answers = await inquirer.prompt([{
      type: 'list',
      name: 'overwrite',
      message: `Target directory ${chalk.green(projectPath)} already exists. Do you want make a overwrite action ?`,
      choices: ['Yes', 'No'],
      filter: function (val) {
        return val.toLowerCase();
      }
    }]);
    if (answers.overwrite === 'yes') {
      waiting.start(`Waiting for remove ${projectPath}`);
      await fsExtra.remove(projectPath);
      waiting.stop();
    } else {
      return; // Abort
    }
  }
  // Template generate
  await generator(options);
  // Proxy vue-cli create process
  // require('@vue/cli/lib/create')(projectName, options);
};
