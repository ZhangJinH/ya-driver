/**
 * Mode === development webpack configs
 */
const getBaseConfig = require('./base');
const merge = require('webpack-merge');

module.exports = function (options) {
  const baseConfig = getBaseConfig(options);
  return merge(baseConfig, {

  });
};
