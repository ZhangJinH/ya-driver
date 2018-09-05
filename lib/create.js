/**
 * Create project template
 */
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer');
const { log } = require('../utils/log');
const { getPkgJson, getLatestVersion } = require('../utils/get-self-meta');

// package.json
const pkgJson = getPkgJson();
const pkgName = pkgJson.name.toUpperCase();

module.exports = async function (projectName, options) {
  options = {
    preset: path.resolve(__dirname, '../presets/default'), // Direct select the default
    ...options
  };
  log('create options', options);
  log(chalk.greenBright(figlet.textSync(pkgJson.name, {
    font: 'Ghost'
  })));
  const currentVersion = pkgJson.version;
  const onlineVersion = await getLatestVersion();
  if (currentVersion === onlineVersion) {
    log(` ${chalk.cyanBright(pkgName)} at ${chalk.cyanBright(currentVersion)} is the latest.`);
  } else {
    log(` ${chalk.cyanBright(pkgName)} with local ${chalk.cyanBright(currentVersion)}is not the same compare with the remote<${chalk.cyanBright(onlineVersion)}>，maybe need a upgrade.`);
  }
  // 组织成path
  const projectPath = path.isAbsolute(projectName) ? projectName : path.resolve(process.cwd(), projectName);
  console.log(projectPath);
  if (fs.existsSync(projectPath)) {
    const answers = await inquirer.prompt([{
      type: 'list',
      name: 'overwrite',
      message: `Target directory ${chalk.cyan(projectPath)} already exists. Do you want make a overwrite action ?`,
      choices: ['Yes', 'No'],
      filter: function (val) {
        return val.toLowerCase();
      }
    }]);
    if (answers.overwrite === 'yes') {
      fsExtra.removeSync(projectPath);
    } else {
      return; // Abort
    }
  }
  const projectCwd = path.dirname(projectPath);
  projectName = path.basename(projectPath); // normalize project name
  console.log('22', projectCwd);
  console.log('33', projectName);
  options.cwd = projectCwd;
  // require('@vue/cli/lib/create')(projectName, options);
};
