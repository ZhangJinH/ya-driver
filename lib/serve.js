/**
 * For local development
 */
const webpack = require('webpack');
const opn = require('opn');
const express = require('express');
// const connectHistoryApiFallback =  require('connect-history-api-fallback');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const getWebpackConfig = require('../config/webpack/development');
const Project = require('./project');
const {
  modeMap,
  defaultDevServerPort
} = require('../config/vars');
const {
  log,
  error
} = require('../utils/log');

module.exports = function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  const {
    appName,
    application
  } = project;
  const config = getWebpackConfig({
    ...options,
    cdnDomain: '/', // 占位
    appDomain: '/', // 占位
    appName, // 和project pkg.name一致
    appEnv: 'local', // 占位
    mode: modeMap.DEV
  });
  const server = express(); // Create express server
  const compiler = webpack(config);
  const publicPath = config.output.publicPath;
  const port = options.port || application.devPort || defaultDevServerPort; // local dev server port

  // handle fallback for HTML5 history API
  // server.use(connectHistoryApiFallback());

  const devMiddleware = webpackDevMiddleware(compiler, {
    stats: {
      colors: true
    },
    publicPath // 伺服 /appName/appVersion/index.html
  });

  const hotMiddleware = webpackHotMiddleware(compiler, {
    // log: false,
    // heartbeat: 2000
  });
  // serve webpack bundle output
  server.use(devMiddleware);

  // enable hot-reload and state-preserving
  // compilation error display
  server.use(hotMiddleware);

  const uri = `http://127.0.0.1:${port}${publicPath}`;
  server.listen(port, () => {
    log(` Dev server listening on ${uri}`);
  });
  // Auto open browser
  devMiddleware.waitUntilValid(() => {
    opn(uri);
  });
};
