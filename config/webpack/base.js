/**
 * The base webpack config
 */
const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {
  npmOnBabel,
  modeMap,
  browserslist,
  filenameCommonPrefix
} = require('../vars');
const Project = require('../../lib/project');

module.exports = function (options) {
  const {
    projectPath,
    mode
  } = options;

  const context = path.resolve(__dirname, '../../'); // context指向工具root path
  const project = new Project(projectPath); // 放置project相关信息
  const {
    outputPath,
    appName
  } = project;
  let publicPath = `/${appName}/`; // 项目名默认就是二级path
  // join cdn path
  if (mode === modeMap.PROD) {
    publicPath = `//cdn-${options.appDomain}${appName}/`;
  }
  const main = path.resolve(projectPath, './src/index.js'); // Use absolute path
  /**
   * 相对projectPath解析地址
   * @param {String} rp - relative path
   */
  const resolveProject = (rp) => {
    return path.resolve(projectPath, rp);
  };
  // resolve babel loaders
  const babelExtResolveMap = new Map();
  ['@babel/preset-env', '@babel/preset-stage-0', '@babel/preset-react', '@babel/preset-flow', '@babel/plugin-transform-runtime', '@babel/plugin-syntax-dynamic-import', 'babel-plugin-lodash'].forEach((name) => {
    babelExtResolveMap.set(name, require.resolve(`../../node_modules/${name}`));
  });
  return {
    mode,
    context,
    entry: {
      main
    },
    output: {
      path: outputPath,
      filename: `${filenameCommonPrefix}/js/[name].js?v=[chunkhash]`,
      chunkFilename: `${filenameCommonPrefix}/js/[name].js?v=[chunkhash]`,
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
            presets: [[babelExtResolveMap.get('@babel/preset-env'), {
              modules: false, // Leave for webpack
              targets: browserslist,
              useBuiltIns: 'usage' // Just for used polyfill
            }], [babelExtResolveMap.get('@babel/preset-stage-0'), {
              useBuiltIns: true // Will use the native built-in instead of trying to polyfill behavior for any plugins that require one.
            }], babelExtResolveMap.get('@babel/preset-react'), babelExtResolveMap.get('@babel/preset-flow')],
            plugins: [
              '@babel/plugin-transform-runtime',
              '@babel/plugin-syntax-dynamic-import',
              'babel-plugin-lodash'
            ].map((name) => babelExtResolveMap.get(name)),
            cacheDirectory: modeMap.DEV === mode // development下生效
          }
        }
      }, {
        test: /\.css$/,
        use: [{
          loader: mode === modeMap.DEV ? 'vue-style-loader' : MiniCssExtractPlugin.loader
        }, {
          loader: 'css-loader',
          options: {
            importLoaders: 1 // 貌似意思是import语句给下面postcss-loader处理
          }
        }, {
          loader: 'postcss-loader',
          options: {
            sourceMap: true,
            ident: 'postcss',
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
        }, {
          loader: 'sass-loader'
        }, {
          loader: 'less-loader'
        }, {
          loader: 'stylus-loader'
        }]
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
        '+': path.resolve(projectPath, './node_modules/ya-spa-vue/ya'),
        '@': path.resolve(projectPath, './src'),
        'vue$': resolveProject('node_modules/vue/dist/vue.esm.js'),
        'ya-ui-vue': resolveProject('node_modules/ya-ui-vue') // For npm link情况，强制指向本项目下ya-ui-vue
      }
    },
    plugins: [
      new VueLoaderPlugin()
    ].concat((() => {
      if (mode === modeMap.PROD) { // 生产环境css提取
        return [
          new MiniCssExtractPlugin({
            filename: `${filenameCommonPrefix}/css/[name].css?v=[contenthash]`
          })
        ];
      } else {
        return [];
      }
    })())
  };
};
