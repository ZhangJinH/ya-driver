/**
 * Accelerate local deploy
 * generate dll files
 */
const webpack = require('webpack');
const getWebpackConfig = require('../config/webpack/dll');
const {
  log,
  error
} = require('../utils/log');

module.exports = function (options) {
  const configs = getWebpackConfig({
    ...options
  });
  const compiler = webpack(configs);
  // complie
  compiler.run((err, stats) => {
    if (err) {
      error(err);
      return;
    }
    log(stats.toString({
      chunks: false, // Makes the build much quieter
      colors: true // Shows colors in the console
    }));
  });
};
