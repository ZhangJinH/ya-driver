/**
 * For remote production
 */
const webpack = require('webpack');
const opn = require('opn');
const express = require('express');
const fsExtra = require('fs-extra');
const request = require('request');
const semver = require('semver');
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

module.exports = async function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  // let {
  //   appName
  // } = project;
  const appName = options.appName;
  const {
    pkgJson,
    outputPath,
    distPath,
    application
  } = project;
  const {
    verifyVersion
  } = application.build;
  if (appName === defaultTemplateName) {
    error(`Project name can't set ${defaultTemplateName}, change another business relevant name`);
    return;
  }
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
  // 验证前端版本号(package.json -> version)
  if (verifyVersion) {
    if (options.appEnv !== 'local') {
      const reqUrl = `https://${options.appDomain}${options.appName}/project.json`;
      log('已开启严格验证semver版本号模式，验证地址', reqUrl);
      const versionResult = await new Promise((resolve) => {
        request(reqUrl, (err, res, body) => {
          if (err) {
            error('版本号验证地址请求失败', err);
            resolve(false);
            process.exit(1);
          } else {
            if (res.statusCode === 200) {
              const data = JSON.parse(body);
              if (!semver.valid(data.version) || !semver.valid(pkgJson.version)) {
                error(`当前打包版本号${pkgJson.version}或远程版本号${data.version}semver格式不正确，请检查`);
                resolve(false);
              }
              if (semver.lte(pkgJson.version, data.version)) {
                error(`当前打包版本号${pkgJson.version}小于或等于远程版本号${data.version}，请检查`);
                resolve(false);
              } else {
                log(`当前打包版本号${pkgJson.version} > 远程版本号${data.version}，符合build条件`);
                resolve(true);
              }
            } else if (res.statusCode === 404) {
              log('未找到远程版本号信息，被认为是第一次发布');
              resolve(true);
            } else {
              error('请求远程版本号信息返回失败', res.statusCode);
              resolve(false);
            }
          }
        });
      });
      if (!versionResult) {
        process.exit(1);
      }
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
