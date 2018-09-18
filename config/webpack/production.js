/**
 * Mode === production webpack configs
 */
const getBaseConfig = require('./base');
// const merge = require('webpack-merge');
const {
  modeMap
} = require('../vars');

module.exports = function (options) {
  const baseConfig = getBaseConfig({
    ...options,
    mode: modeMap.PROD
  });
  let configs = {
    ...baseConfig,
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxAsyncRequests: Infinity
      }
    }
  };
  return configs;
};
