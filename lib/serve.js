/**
 * For local development
 */
const webpack = require('webpack');
const getWebpackConfig = require('../config/webpack/development');
const {
  modeMap
} = require('../config/vars');
const {
  log,
  error
} = require('../utils/log');

module.exports = function (options) {
  const config = getWebpackConfig({
    ...options,
    mode: modeMap.DEV
  });
  const compiler = webpack(config);
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
