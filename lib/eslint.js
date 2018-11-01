/**
 * Install recommend eslint scheme
 */
const path = require('path');
const install = require('yarn-install');
const fsExtra = require('fs-extra');
const Project = require('./project');
const {
  getPkgJson: getSelfPkgJson
} = require('../utils/self-meta');
const {
  log
} = require('../utils/log');

const {
  processSendSilent
} = require('../utils/helper');

module.exports = function (options) {
  const projectPath = options.projectPath;
  const project = new Project(options.projectPath); // 放置project相关信息

  const selfPkgJson = getSelfPkgJson();
  // Filter eslint deps
  const eslintDeps = Object.keys(selfPkgJson.dependencies).reduce((pv, cv) => {
    if (cv.slice(0, 6) === 'eslint') {
      return {
        ...pv,
        [cv]: selfPkgJson.dependencies[cv]
      }
    } else {
      return pv;
    }
  }, {});
  eslintDeps['babel-eslint'] = selfPkgJson.dependencies['babel-eslint'];
  // Install deps in project
  install({
    cwd: projectPath,
    dev: true,
    deps: Object.keys(eslintDeps).map((key) => {
      return `${key}@${eslintDeps[key]}`;
    })
  });
  // Move eslint*  from devDependencies to peerDependencies
  let {
    pkgJson: projectPkgJson,
    savePkgJson: saveProjectPkgJson
  } = project;
  Object.keys(eslintDeps).forEach((key) => {
    projectPkgJson.peerDependencies = {
      ...(projectPkgJson.peerDependencies || {}),
      [key]: projectPkgJson.devDependencies[key]
    };
    delete projectPkgJson.devDependencies[key];
  });

  // Save
  saveProjectPkgJson(projectPkgJson);
  log('ESlint dependencies installed');

  // Create config
  ['eslintrc', 'eslintignore'].forEach((fileName) => {
    fsExtra.copySync(path.resolve(__dirname, `../config/webpack/loaders/eslint/${fileName}`), path.resolve(projectPath, `.${fileName}`));
  });
  log('ESlint config file created');

  processSendSilent({
    action: 'complete'
  });
};
