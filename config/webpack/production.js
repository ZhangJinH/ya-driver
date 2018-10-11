/**
 * Mode === production webpack configs
 */
const getBaseConfig = require('./base');
// const merge = require('webpack-merge');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
// const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
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
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: true // set to true if you want JS source maps
        })
        // new OptimizeCSSAssetsPlugin({})
      ],
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxAsyncRequests: Infinity
      }
    }
  };
  return configs;
};
