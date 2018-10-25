/**
 * Mode === development webpack configs
 */
// const path = require('path');
const getBaseConfig = require('./base');
// const merge = require('webpack-merge');
const {
  modeMap
} = require('../vars');
const {
  resolveDriverNpm
} = require('../../utils/helper');
// const Project = require('../../lib/project');

module.exports = function (options) {
  // const project = new Project(options.projectPath); // 放置project相关信息
  // const {
  //   appName
  // } = project;

  const baseConfig = getBaseConfig({
    ...options,
    cdnDomain: '/', // 占位
    appDomain: '/', // 占位
    // appName, // 和project pkg.name一致，在cli-args.js中预处理
    appEnv: 'local', // 占位
    mode: modeMap.DEV
  });
  let configs = {
    ...baseConfig
  };
  // Add hot-reload relevant
  // configs.devServer = {
  //   hot: true
  // };
  // const hotClientScriptPath = path.resolve(__dirname, '../../node_modules/webpack-hot-middleware/client?reload=true'); // hot failed auto reload
  const hotClientScriptPath = resolveDriverNpm('webpack-hot-middleware/client', {
    extensions: ['js']
  }); // hot failed auto reload
  configs.entry['main'] = [`${hotClientScriptPath}?reload=true`].concat(configs.entry['main']);
  return configs;
};
