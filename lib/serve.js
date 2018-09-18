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
const proxyMiddleware = require('http-proxy-middleware');
const getWebpackConfig = require('../config/webpack/development');
const Project = require('./project');
const mock = require('./mock');
const {
  preset: staticPreset
} = require('./static');
const {
  modeMap,
  defaultDevServerPort,
  proxyTable: defaultProxyTable,
  localhost
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

  // Forward proxy api requests
  const proxyTable = {
    ...defaultProxyTable,
    ...application.proxyTable || {}
  };
  Object.keys(proxyTable).forEach(function (context) {
    let options = proxyTable[context];
    if (typeof options === 'string') {
      options = {
        target: options
      };
    }
    options.cookieDomainRewrite = localhost; // All domain cooke rewrite to localhost
    options.preserveHeaderKeyCase = true;
    options.debug = true;
    options.secure = false;
    options.onProxyRes = (proxyRes) => {
      let setCookieHeaders = proxyRes.headers['set-cookie'] || [];
      // cookie path改成 /
      setCookieHeaders = setCookieHeaders.map((cookieItem) => {
        let cookieArr = cookieItem.split(';');
        cookieArr = cookieArr.map((itemFlagment) => {
          itemFlagment = itemFlagment.trim();
          if (itemFlagment.slice(0, 4) === 'Path') {
            itemFlagment = 'Path=/';
          }
          return itemFlagment;
        });
        return cookieArr.join('; ');
      });
      proxyRes.headers['set-cookie'] = setCookieHeaders;
    };
    server.use(proxyMiddleware(options.filter || context, options));
  });

  // handle fallback for HTML5 history API
  // server.use(connectHistoryApiFallback());

  console.log('public', publicPath);

  const devMiddleware = webpackDevMiddleware(compiler, {
    stats: {
      colors: true
    },
    // publicPath: `/${appName}`
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
