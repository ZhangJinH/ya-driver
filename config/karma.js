/**
 * Karma config
 */
const {
  merge
} = require('lodash');
// const {
//   log
// } = require('../utils/log');
const {
  modeMap
} = require('./vars');
const Project = require('../lib/project');

module.exports = function (options) {
  options = merge({
    mode: modeMap.DEV // Test下依然区分development/production，复用build mode，但目前貌似没多大意义，DEV模式下code不压缩
  }, options);
  const project = new Project(options.projectPath); // 放置project相关信息
  const {
    srcPath,
    coveragePath,
    application
  } = project;

  // webpack config
  const webpackConfig = merge(require(`./webpack/${options.mode}`)({
    ...options,
    test: true // 传递test状态标识
  }), {
    devtool: 'inline-source-map' // 保证内联source map
  });
  // Delete entry
  delete webpackConfig.entry;
  // delete webpackConfig.optimization;
  delete webpackConfig.output;
  delete webpackConfig.externals;

  let {
    files
  } = application.karma;
  let preprocessors = {};

  if (!files || !files.length) {
    files = [{
      pattern: 'test/**/*.spec.js',
      watched: false
    }];
    preprocessors = {
      'test/**/*.spec.js': ['webpack', 'sourcemap']
    };
  } else {
    files = files.map((file) => {
      let item = file;
      if (typeof item === 'string') {
        item = {
          pattern: file,
          watched: false
        };
      }
      preprocessors[item.pattern] = ['webpack', 'sourcemap'];
      // preprocessors[item.pattern] = ['webpack'];
      return item;
    });
  }
  // preprocessors['**/*.vue'] = ['webpack', 'sourcemap', 'coverage'];
  const karmaConfig = merge({
    // browsers: ['ChromeHeadless'], // From project.js
    // singleRun: true,
  }, application.karma, {
    frameworks: ['mocha', 'chai', 'sinon'],
    basePath: srcPath,
    files,
    preprocessors,
    webpack: webpackConfig,
    reporters: ['spec', 'coverage'],
    coverageReporter: {
      instrumenterOptions: {
        istanbul: {
          noCompact: true
        }
      },
      type: 'html',
      dir: coveragePath,
      subdir: 'report'
    }
  });

  return karmaConfig;
};
