/**
 * The base webpack config
 */
const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {
  npmOnBabel,
  modeMap,
  browserslist
} = require('../vars');

module.exports = function (options) {
  const {
    projectPath,
    mode
  } = options;

  const main = path.resolve(projectPath, './src/index.js');

  return {
    entry: {
      main
    },
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
            }], ['@babel/stage-0', {
              useBuiltIns: true // Will use the native built-in instead of trying to polyfill behavior for any plugins that require one.
            }], '@babel/react', '@babel/flow'],
            plugins: [
              '@babel/plugin-transform-runtime',
              '@babel/plugin-syntax-dynamic-import',
              'babel-plugin-lodash'
            ],
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
            sourceMap: true
          }
        }, {
          loader: 'sass-loader'
        }, {
          loader: 'less-loader'
        }, {
          loader: 'stylus-loader'
        }]
      }]
    },
    resolve: {
      alias: {
        '+': path.resolve(projectPath, './node_modules/ya-spa-vue/ya'),
        '@': path.resolve(projectPath, './src')
      }
    },
    plugins: [
      new VueLoaderPlugin()
    ].concat((() => {
      if (mode === modeMap.PROD) { // 生产环境css提取
        return [
          new MiniCssExtractPlugin({
            filename: 'style.css'
          })
        ];
      }
    })())
  };
};
