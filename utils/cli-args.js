/**
 * Normalize cli args
 */
const path = require('path');
const fs = require('fs');
const {
  camelCase
} = require('lodash');
const Project = require('../lib/project');

module.exports = function (projectName, cmd) {
  const projectPath = path.isAbsolute(projectName) ? projectName : path.resolve(process.cwd(), projectName);
  // const projectContext = path.dirname(projectPath);
  projectName = path.basename(projectPath); // normalize project name
  if (!fs.existsSync(projectPath)) {
    throw new Error(`No ${projectPath} exist`);
  }
  let options = getCleanArgs(cmd);
  // options.context = projectContext;
  options.projectPath = projectPath;
  options.projectName = projectName;
  if (options.appDomain) {
    if (options.appDomain.slice(-1) !== '/') { // 保证以/结尾
      options.appDomain = options.appDomain + '/';
    }
  }
  const project = new Project(options.projectPath); // 放置project相关信息
  const {
    appName
  } = project;
  options.appName = options.appName || appName; // 默认从package.json name中读取
  return options;
};

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function getCleanArgs (cmd) {
  let args = {};
  cmd.options.forEach(o => {
    const key = camelCase(o.long);
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key];
    }
  });
  return args;
}
