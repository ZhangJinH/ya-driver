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
    files = [
      'test/**/*.spec.js'
    ];
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
    // browsers: ['ChromeHeadless'] // From project.js
  }, application.karma, {
    singleRun: true,
    frameworks: ['mocha', 'chai', 'sinon'],
    basePath: srcPath,
    files,
    preprocessors,
    webpack: webpackConfig,
    reporters: ['spec', 'coverage'],
    // reporters: ['progress', 'coverage'],
    // reporters: ['spec', 'istanbul'],
    // plugins: ['karma-coverage-istanbul-reporter'],
    // reporters: ['spec', 'coverage-istanbul'],
    // coverageIstanbulReporter: {
    //   reports: ['html', 'lcovonly', 'text-summary'],

    //   // base output directory. If you include %browser% in the path it will be replaced with the karma browser name
    //   dir: coveragePath,

    //   // Combines coverage information from multiple browsers into one report rather than outputting a report
    //   // for each browser.
    //   combineBrowserReports: true,

    //   // if using webpack and pre-loaders, work around webpack breaking the source path
    //   fixWebpackSourcePaths: true,

    //   // Omit files with no statements, no functions and no branches from the report
    //   skipFilesWithNoCoverage: true
    // },
    // istanbulReporter: {
    //   dir: 'cover/',     // changed default output dir from 'coverage/'
    //   subdir: 'report',
    //   reporters: [
    //     // reporters not supporting the `file` property
    //     { type: 'html', subdir: 'report-html' },
    //     { type: 'lcov', subdir: 'report-lcov' },
    //     // reporters supporting the `file` property, use `subdir` to directly
    //     // output them in the `dir` directory
    //     { type: 'cobertura', subdir: '.', file: 'cobertura.txt' },
    //     { type: 'lcovonly', subdir: '.', file: 'report-lcovonly.txt' },
    //     { type: 'teamcity', subdir: '.', file: 'teamcity.txt' },
    //     { type: 'text', subdir: '.', file: 'text.txt' },
    //     { type: 'text-summary', subdir: '.', file: 'text-summary.txt' }
    //   ]
    // },
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
