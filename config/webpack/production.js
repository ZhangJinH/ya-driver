/**
 * Mode === production webpack configs
 */
const getBaseConfig = require('./base');
// const merge = require('webpack-merge');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const {
  modeMap
} = require('../vars');
const Project = require('../../lib/project');

module.exports = function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  const {
    application
  } = project;
  // let {
  //   appName
  // } = project;

  if (options.appEnv === 'local') { // 本地Test
    if (!options.appDomain) {
      options.appDomain = 'local/';
    }
    if (!options.cdnDomain) {
      options.cdnDomain = '/'; // 本地测试占位
    }
  }
  // appName = options.appName || appName; // 应该和project pkg.name一致
  const baseConfig = getBaseConfig({
    ...options,
    cdnDomain: options.cdnDomain || `//cdn-${options.appDomain}`, // cdn 地址
    // appDomain: options.appDomain,
    // appName,
    // appEnv: options.appEnv, // 环境名
    mode: modeMap.PROD
  });
  const {
    singleStyleFile,
    optimizeStyle
  } = application.build;

  let cacheGroups = {}; // splitChunks configs
  if (singleStyleFile) { // Merge to one style file
    cacheGroups.styles = {
      name: 'styles',
      // test: /\.(css|less|styl|stylus|sass|scss|vue)$/,
      test: m => m.constructor.name === 'CssModule', // 会产生额外的styles.js https://github.com/webpack-contrib/mini-css-extract-plugin/issues/113
      chunks: 'all',
      minChunks: 1,
      enforce: true
    };
  }

  let configs = {
    ...baseConfig,
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: true // set to true if you want JS source maps
        })
        // new OptimizeCSSAssetsPlugin({})
      ].concat(optimizeStyle ? [new OptimizeCSSAssetsPlugin({})] : []),
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxAsyncRequests: Infinity,
        cacheGroups
      }
    }
  };
  return configs;
};
