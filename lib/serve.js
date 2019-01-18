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
const reporter = require('webpack-dev-middleware/lib/reporter');
const webpackHotMiddleware = require('webpack-hot-middleware');
const getWebpackConfig = require('../config/webpack/development');
const Project = require('./project');
const useProxyMw = require('../config/express/middlewares/proxy');
const mock = require('./mock');
const {
  preset: staticPreset
} = require('./static');
const {
  localhost
} = require('../config/vars');
const {
  log
  // error
} = require('../utils/log');
const {
  processSendSilent,
  getAbsProjectFilePath
} = require('../utils/helper');

module.exports = function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  const {
    // appName,
    application,
    dllPath,
    srcPath
  } = project;
  const configs = getWebpackConfig({
    ...options
    // cdnDomain: '/', // 占位
    // appDomain: '/', // 占位
    // appName, // 和project pkg.name一致
    // appEnv: 'local', // 占位
    // mode: modeMap.DEV
  });
  const {
    srcStaticPath // src下static目录地址
  } = staticPreset(options);
  const server = express(); // Create express server
  const compiler = webpack(configs);
  const publicPath = configs.output.publicPath;
  const port = options.port || application.devPort; // local dev server port

  // Apply proxy middleware
  useProxyMw({
    ...options,
    server
  });

  const devMiddleware = webpackDevMiddleware(compiler, {
    stats: {
      colors: true
    },
    // publicPath: `/${appName}`
    publicPath, // 伺服 /appName/appVersion/index.html
    reporter: (...args) => {
      processSendSilent({
        action: 'compiled'
      });
      reporter.apply(this, args);
    }
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

  // 伺服二级 static path，保持和线上访问路径一致
  server.use(`${publicPath}static`, express.static(srcStaticPath));
  server.use(`/${options.appName}/static`, express.static(srcStaticPath)); // 兼容历史

  // 伺服二级path，指向src/entry目录
  const srcEntryPath = path.resolve(srcPath, './entry');
  if (fs.existsSync(srcEntryPath)) {
    server.use(`/${options.appName}`, express.static(srcEntryPath));
  }

  // 伺服service worker script
  const serviceWorker = application.serviceWorker;
  if (serviceWorker) {
    const serviceWorkerFilePath = getAbsProjectFilePath(options.projectPath, serviceWorker);
    if (serviceWorkerFilePath) {
      server.use(`${publicPath}sw.js`, express.static(serviceWorkerFilePath));
    }
  }

  const dllFilePath = path.resolve(dllPath, './dll.js');
  if (fs.existsSync(dllFilePath)) {
    server.use(`${publicPath}dll`, express.static(dllPath));
  }

  const uri = `http://${localhost}:${port}${publicPath}#/`;
  server.listen(port, () => {
    log(` Dev server listening on ${uri}`);
  });
  // Auto open browser
  devMiddleware.waitUntilValid(() => {
    if (options.mock) {
      mock({
        ...options,
        callback() {
          opn(uri);
        }
      });
    } else {
      opn(uri);
    }
  });
};
