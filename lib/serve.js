/**
 * For local development
 */
const webpack = require('webpack');
const merge = require('webpack-merge');
const getBaseConfig = require('../config/webpack/base');
const {
  log,
  error
} = require('../utils/log');

module.exports = function (options) {
  const baseConfig = getBaseConfig(options);
  const compiler = webpack(merge(baseConfig, {
    mode: 'development'
  }));
  compiler.watch({
    // aggregateTimeout: 300,
    // poll: undefined
  }, (err, stats) => {
    if (err) {
      error(err);
    } else {
      log(stats);
    }
  });
};
