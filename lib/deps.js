/**
 * Dependencies install
 */
const fs = require('fs');
const install = require('yarn-install');
const Project = require('./project');
const {
  error
} = require('../utils/log');

module.exports = function (options) {
  const projectPath = options.projectPath;
  const project = new Project(projectPath); // 放置project相关信息
  let {
    pkgJsonPath
  } = project;
  if (!fs.existsSync(pkgJsonPath)) {
    error(`${pkgJsonPath} not exists`);
  } else {
    install({
      cwd: projectPath
    });
  }
};
