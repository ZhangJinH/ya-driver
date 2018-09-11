/**
 * Mode === development webpack configs
 */
const getBaseConfig = require('./base');
const merge = require('webpack-merge');
const {
  modeMap
} = require('../vars');

module.exports = function (options) {
  const baseConfig = getBaseConfig({
    ...options,
    mode: modeMap.DEV
  });
  return merge(baseConfig, {
  });
};
