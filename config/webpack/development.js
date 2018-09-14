/**
 * Mode === development webpack configs
 */
const path = require('path');
const getBaseConfig = require('./base');
// const merge = require('webpack-merge');
const {
  modeMap
} = require('../vars');

module.exports = function (options) {
  const baseConfig = getBaseConfig({
    ...options,
    mode: modeMap.DEV
  });
  let configs = {
    ...baseConfig
  };
  // Add hot-reload relevant
  // configs.devServer = {
  //   hot: true
  // };
  const hotClientScriptPath = path.resolve(__dirname, '../../node_modules/webpack-hot-middleware/client?reload=true'); // hot failed auto reload
  configs.entry['main'] = [hotClientScriptPath].concat(configs.entry['main']);
  return configs;
};
