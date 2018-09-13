/**
 * The base webpack config
 */
const path = require('path');
const fsExtra = require('fs-extra');
const fs = require('fs');
const {
  merge
} = require('lodash');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {
  npmOnBabel,
  modeMap,
  browserslist,
  filenameCommonPrefix
} = require('../vars');
const Project = require('../../lib/project');
// Resolve self node_modules path
const resolveDriverNpm = (name) => {
  return require.resolve(`../../node_modules/${name}`);
};
const getRelativeDriverPath = (rp) => {
  return path.resolve(__dirname, `../../${rp}`);
};

module.exports = function (options) {
  const {
    projectPath,
    mode
  } = options;

  const context = path.resolve(__dirname, '../../'); // context指向工具root path
  const project = new Project(projectPath); // 放置project相关信息
  const {
    outputPath,
    distPath,
    appVersion,
    application
  } = project;
  // html template
  const htmlTemplate = {
    ...application.template,
    title: application.template.title || 'Yazuo App'
  };
  // Delete template and templateContent, can't custom
  delete htmlTemplate.template;
  delete htmlTemplate.templateContent;

  let publicPath = `${options.cdnDomain}${options.appName}/${appVersion}/`; // 项目名默认就是二级path
  // // join cdn path
  // if (mode === modeMap.PROD) {
  //   publicPath = `//cdn-${options.appDomain}${appName}/${appVersion}/`;
  // }
  const main = path.resolve(projectPath, './src/index.js'); // Use absolute path

  /**
   * 相对projectPath解析地址
   * @param {String} rp - relative path
   */
  const getRelativeProjectPath = (rp) => {
    return path.resolve(projectPath, rp);
  };

  /**
   * Get the presets style processor
   * @param {String} preProcessor - style pre-processor name
   */
  const getStyleLoaderPresets = (preProcessor) => {
    let styleLoaderName = 'vue-style-loader';
    if (preProcessor === 'stylus') { // TODO: stylus文件单独加载用vue-style-loader会导致HMR失效，待查
      styleLoaderName = 'style-loader';
    }
    return [{
      loader: mode === modeMap.DEV ? styleLoaderName : MiniCssExtractPlugin.loader
    }, {
      loader: 'css-loader',
      options: {
        importLoaders: 1, // 貌似意思是import语句给下面postcss-loader处理
        sourceMap: true
      }
    }, {
      loader: 'postcss-loader',
      options: {
        syntax: 'sugarss',
        sourceMap: true,
        ident: `postcss-${preProcessor}`,
        plugins: (loader) => [
          require('postcss-import')({
            root: projectPath
          }),
          require('postcss-preset-env')({
            stage: 2, // CSS features to polyfill
            browsers: browserslist
          }),
          require('cssnano')()
        ]
      }
    }];
  };
  // Return configs
  return {
    mode,
    context,
    entry: {
      main
    },
    output: {
      path: outputPath,
      filename: `${filenameCommonPrefix}/js/[name].js?v=[hash]`,
      chunkFilename: `${filenameCommonPrefix}/js/[name].js?v=[hash]`,
      publicPath
    },
    devtool: 'source-map', // chrome devtool更友好
    module: {
      rules: [{
        test: /\.vue$/,
        loader: 'vue-loader'
      }, {
        test: /\.js$/,
        include: function (src) {
          src = src.split('\\').join('/');
          if (src.search('node_modules') === -1) { // 非node_modules都走转义
            return true;
          } else {
            // node_modules目录下除了vars.js下npmOnbabel定义开头的包，其它都不走babel转义
            if (npmOnBabel.some((pkgPrefix) => {
              if (src.search(`node_modules/${pkgPrefix}-`) >= 0) {
                return true;
              }
            })) {
              return true;
            } else {
              return false;
            }
          }
        },
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', {
              modules: false, // Leave for webpack
              targets: browserslist,
              useBuiltIns: 'usage' // Just for used polyfill
            }], ['@babel/preset-react'], ['@babel/preset-flow']].map((preset) => {
              preset[0] = resolveDriverNpm(preset[0]);
              return preset;
            }),
            plugins: [
              // Stage 0
              ['@babel/plugin-proposal-function-bind'],

              // Stage 1
              ['@babel/plugin-proposal-export-default-from'],
              ['@babel/plugin-proposal-logical-assignment-operators'],
              ['@babel/plugin-proposal-optional-chaining', { 'loose': false }],
              ['@babel/plugin-proposal-pipeline-operator', { 'proposal': 'minimal' }],
              ['@babel/plugin-proposal-nullish-coalescing-operator', { 'loose': false }],
              ['@babel/plugin-proposal-do-expressions'],

              // Stage 2
              ['@babel/plugin-proposal-decorators', { 'legacy': true }],
              ['@babel/plugin-proposal-function-sent'],
              ['@babel/plugin-proposal-export-namespace-from'],
              ['@babel/plugin-proposal-numeric-separator'],
              ['@babel/plugin-proposal-throw-expressions'],

              // Stage 3
              ['@babel/plugin-syntax-dynamic-import'],
              ['@babel/plugin-syntax-import-meta'],
              ['@babel/plugin-proposal-class-properties', { 'loose': false }],
              ['@babel/plugin-proposal-json-strings'],

              // runtime
              ['@babel/plugin-transform-runtime'],

              // min lodash
              ['babel-plugin-lodash']
            ].map((plugin) => {
              plugin[0] = resolveDriverNpm(plugin[0]);
              return plugin;
            }),
            cacheDirectory: modeMap.DEV === mode // development下生效
          }
        }
      }, {
        test: /\.css$/,
        use: getStyleLoaderPresets('css')
      }, {
        test: /\.styl(us)?$/,
        use: getStyleLoaderPresets('stylus').concat({
          loader: 'stylus-loader',
          options: {
            sourceMap: true
          }
        })
      }, {
        test: /\.less?$/,
        use: getStyleLoaderPresets('less').concat({
          loader: 'less-loader',
          options: {
            sourceMap: true
          }
        })
      }, {
        test: /\.(sass|scss)(\?.*)?$/,
        use: getStyleLoaderPresets('sass').concat({
          loader: 'sass-loader',
          options: {
            sourceMap: true
          }
        })
      }, {
        test: /\.html$/,
        loader: 'html-loader'
      }, {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 1024,
          name: `${filenameCommonPrefix}/img/[name].[ext]?v=[hash]`
        }
      }, {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 1024,
          name: `${filenameCommonPrefix}/media/[name].[ext]?v=[hash]`
        }
      }, {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 1024,
          name: `${filenameCommonPrefix}/fonts/[name].[ext]?v=[hash]`
        }
      }]
    },
    resolve: {
      alias: {
        '@babel': getRelativeDriverPath('node_modules/@babel'), // Force @babel resolve through driver
        'vue$': getRelativeDriverPath('node_modules/vue/dist/vue.esm.js'),
        'vuex$': getRelativeDriverPath('node_modules/vuex/dist/vuex.esm.js'),
        'vue-router$': getRelativeDriverPath('node_modules/vue-router/dist/vue-router.esm.js'),
        '+': getRelativeProjectPath('node_modules/ya-spa-vue/ya'),
        '@': getRelativeProjectPath('src'),
        'ya-ui-vue': getRelativeProjectPath('node_modules/ya-ui-vue') // For npm link情况，强制指向本项目下ya-ui-vue
      },
      extensions: ['.wasm', '.mjs', '.js', '.vue', '.json']
    },
    plugins: [
      new VueLoaderPlugin(),
      new HtmlWebpackPlugin(merge({
        appMountId: 'app', // Dom container id
        mobile: true
      }, htmlTemplate, {
        inject: false,
        filename: mode === modeMap.PROD ? path.resolve(distPath, 'index.html') : 'index.html', // Ouput the root of dist
        template: path.resolve(__dirname, '../template.ejs'),
        window: {
          APP_DOMAIN: options.appDomain, // 部署域名
          APP_NAME: options.appName, // 项目二级path名
          APP_ENV: options.appEnv, // 部署环境
          APP_VERSION: appVersion, // 项目版本号
          STATIC_PATH: `/${options.appName}/${appVersion}/static/`, // 静态目录伺服地址，同域下
          STATIC_CDN: `${publicPath}static/` // 静态目录伺服地址，通过cdn请求，会造成跨域问题，注意请求地址后手动添加版本号
        }
      }))
    ].concat((() => {
      if (mode === modeMap.PROD) { // 生产环境css提取
        return [
          new MiniCssExtractPlugin({
            filename: `${filenameCommonPrefix}/css/[name].css?v=[contenthash]`
          })
        ];
      } else if (mode === modeMap.DEV) {
        return [
          new webpack.HotModuleReplacementPlugin()
        ];
      } else {
        return [];
      }
    })())
  };
};
