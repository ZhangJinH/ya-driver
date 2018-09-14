/**
 * For local development
 */
const webpack = require('webpack');
const opn = require('opn');
const fs = require('fs');
const path = require('path');
const express = require('express');
// const connectHistoryApiFallback =  require('connect-history-api-fallback');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const getWebpackConfig = require('../config/webpack/development');
const Project = require('./project');
const {
  preset: staticPreset
} = require('./static');
const {
  modeMap,
  defaultDevServerPort
} = require('../config/vars');
const {
  log
} = require('../utils/log');

module.exports = function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  const {
    appName,
    application,
    dllPath
  } = project;
  const configs = getWebpackConfig({
    ...options,
    cdnDomain: '/', // 占位
    appDomain: '/', // 占位
    appName, // 和project pkg.name一致
    appEnv: 'local', // 占位
    mode: modeMap.DEV
  });
  const {
    srcStaticPath // src下static目录地址
  } = staticPreset(options);
  const server = express(); // Create express server
  const compiler = webpack(configs);
  const publicPath = configs.output.publicPath;
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

  // 伺服二级path，保持和线上访问路径一致
  server.use(`${publicPath}static`, express.static(srcStaticPath));

  const dllFilePath = path.resolve(dllPath, './dll.js');
  if (fs.existsSync(dllFilePath)) {
    fs.writeFileSync(dllFilePath, fs.readFileSync(dllFilePath, 'utf8').replace(/"use\sstrict"/g, ''), 'utf8');
  }
  server.use(`${publicPath}dll`, express.static(dllPath));

  const uri = `http://127.0.0.1:${port}${publicPath}`;
  server.listen(port, () => {
    log(` Dev server listening on ${uri}`);
  });
  // Auto open browser
  devMiddleware.waitUntilValid(() => {
    opn(uri);
  });
};
