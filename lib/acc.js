/**
 * Accelerate local deploy
 * generate dll files
 */
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const getWebpackConfig = require('../config/webpack/dll');
const {
  log,
  error
} = require('../utils/log');
const Project = require('./project');

module.exports = function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  const {
    dllPath
  } = project;
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
    if (!stats.hasErrors()) {
      // Remove use strict flag
      const dllFilePath = path.resolve(dllPath, './dll.js');
      fs.writeFileSync(dllFilePath, fs.readFileSync(dllFilePath, 'utf8').replace(/"use\sstrict"/g, ''), 'utf8');
    }
    log(stats.toString({
      chunks: false, // Makes the build much quieter
      colors: true // Shows colors in the console
    }));
  });
};
