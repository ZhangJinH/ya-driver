/**
 * For remote production
 */
const webpack = require('webpack');
const opn = require('opn');
const express = require('express');
const fsExtra = require('fs-extra');
const Project = require('./project');
const getWebpackConfig = require('../config/webpack/production');
const useProxyMw = require('../config/express/middlewares/proxy');
const {
  // modeMap,
  localhost,
  defaultTemplateName
} = require('../config/vars');
const {
  log,
  error
} = require('../utils/log');
const {
  preset: staticPreset,
  build: staticBuild
} = require('./static');
const {
  processSendSilent
} = require('../utils/helper');

module.exports = function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  // let {
  //   appName
  // } = project;
  const appName = options.appName;
  const {
    outputPath,
    distPath,
    application
  } = project;
  if (appName === defaultTemplateName) {
    error(`Project name can't set ${defaultTemplateName}, change another business relevant name`);
    return;
  }
  // if (options.appEnv === 'local') { // 本地Test
  //   if (!options.appDomain) {
  //     options.appDomain = 'local/';
  //   }
  //   if (!options.cdnDomain) {
  //     options.cdnDomain = '/'; // 本地测试占位
  //   }
  // }
  // if (!options.appDomain) {
  //   error('Missing --app-domain argument');
  //   return;
  // }
  if (!options.appEnv) {
    error('Missing --app-env argument');
    return;
  }
  if (options.appEnv !== 'local') {
    if (!options.appDomain) {
      error('Missing --app-domain argument');
      return;
    }
  }
  // appName = options.appName || appName; // 应该和project pkg.name一致
  const configs = getWebpackConfig({
    ...options
    // cdnDomain: options.cdnDomain || `//cdn-${options.appDomain}`, // cdn 地址
    // appDomain: options.appDomain,
    // appName,
    // appEnv: options.appEnv, // 环境名
    // mode: modeMap.PROD
  });
  const compiler = webpack(configs);
  // First delete previous output
  fsExtra.removeSync(outputPath);
  // Static preset
  staticPreset(options);
  // complie
  compiler.run((err, stats) => {
    log(stats.toString({
      chunks: false, // Makes the build much quieter
      colors: true // Shows colors in the console
    }));
    processSendSilent({
      action: 'compiled'
    });
    // No error output static
    if (!stats.hasErrors()) {
      staticBuild(options);
      if (options.appEnv === 'local') { // 本地测试建立static server
        const server = express(); // Create express server
        const port = application.productionPort; // production dev server port
        const uri = `http://${localhost}:${port}/${appName}/#/`;

        // Apply proxy middleware
        useProxyMw({
          ...options,
          server
        });

        server.use(`/${appName}`, express.static(distPath));
        server.listen(port, () => {
          log(` Production server listening on ${uri}`);
          opn(uri);
        });
      }
    } else {
      error(err);
      process.exit(1); // Exit process
    }
  });
};
