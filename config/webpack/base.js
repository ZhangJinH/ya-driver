/**
 * The base webpack config
 */
const path = require('path');
const fsExtra = require('fs-extra');
const fs = require('fs');
const {
  merge
} = require('lodash');
const md5 = require('md5');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const ParseAtFlagPlugin = require('./plugins/webpack-parse-at-flag');
const RemoveStrictFlagPlugin = require('./plugins/webpack-remove-strict-flag');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin'); // import path大小写敏感
const PatchjsWebpackPlugin = require('patchjs-webpack-plugin');
const {
  npmOnBabel,
  modeMap,
  browserslist,
  filenameCommonPrefix,
  reactVersion,
  serviceWorkerFilename,
  patchjsConfig,
  localhost
} = require('../vars');
const {
  log
} = require('../../utils/log');
const {
  ipcEnabled,
  resolveDriverNpm,
  getAbsProjectFilePath
} = require('../../utils/helper');
const Project = require('../../lib/project');

// const rootPath = path.resolve(__dirname, '../../');
// Resolve self node_modules path
// const resolveDriverNpm = (name) => {
//   return require.resolve(name, {
//     paths: [
//       rootPath
//     ]
//   });
//   // return require.resolve(`../../node_modules/${name}`);
// };
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
    srcPath,
    appVersion,
    application,
    isNeedReact,
    isNeedDll,
    dllPath,
    eslintConfigs,
    resolveProjectNpm
  } = project;
  const {
    webpackConfigPipe,
    removeStrictFlag,
    optimizeVue, // vue相关合并成一个文件
    optimizeReact, // react相关合并成一个文件
    manualLoadReact, // 是否由项目本身加载react库文件
    manualLoadVue, // 是否由项目本身加载vue库文件
    cdnDisabled, // 是否走cdn，默认走cdn
    componentImportAsRequired, // 拆分整体引入组件库成按需引入
    ignoreRequestHash
  } = application.build;
  let {
    patchjs
  } = application.build;
  const productionPort = application.productionPort;
  let publicPath = ''; // 项目名默认就是二级path
  if (cdnDisabled) {
    publicPath = `${options.appDomain}${options.appName}/${appVersion}/`;
    if (publicPath.slice(0, 1) !== '/') {
      publicPath = '//' + publicPath;
    }
  } else {
    publicPath = `${options.cdnDomain}${options.appName}/${appVersion}/`;
  }

  let staticPath = `/${options.appName}/${appVersion}/static/`; // 静态目录伺服地址，同域下

  if (mode === modeMap.PROD) {
    if (options.sdk) {
      publicPath = `./${appVersion}/`;
      staticPath = `./${appVersion}/`;
    }
  }
  const staticCDN = `${publicPath}static/`; // 静态目录伺服地址，通过cdn请求，会造成跨域问题，注意请求地址后手动添加版本号

  // 内联scripts/styles
  const normalizeInlineSS = (inlines) => {
    return inlines ? [].concat(inlines).map((filePath) => {
      let absPath = '';
      if (path.isAbsolute(filePath)) {
        absPath = filePath;
      } else if (filePath.slice(0, 2) === '@/') {
        absPath = path.resolve(srcPath, filePath.slice(2));
      } else {
        absPath = path.resolve(projectPath, filePath);
      }
      return fs.readFileSync(absPath, 'utf8');
    }) : [];
  };
  let inlineScripts = normalizeInlineSS(application.template.inlineScripts);
  const serviceWorker = application.serviceWorker;
  if (serviceWorker) {
    const serviceWorkerFilePath = getAbsProjectFilePath(projectPath, serviceWorker);
    if (serviceWorkerFilePath) { // Must exist
      const swHash = md5(fs.readFileSync(serviceWorkerFilePath));
      inlineScripts = [`
        if (window.navigator && window.navigator.serviceWorker) {
          window.navigator.serviceWorker.register('${serviceWorkerFilename}.js?v=${swHash}').then(function (registration) {
            console.log('Service worker installed', registration);
          }).catch(function (err) {
            console.error('Service worker install failed', err);
          });
        }
      `].concat(inlineScripts);
    }
  }
  // Apply patchjs
  let patchBootstrap = '';
  let patchjsPath = `https://${options.appDomain}${options.appName}/`;
  // 本地环境下如果patchjs被配置，但是patchjs.path没有指定，会直接忽略patchjs机制
  if (patchjs && options.appEnv === 'local') {
    if (!patchjs.path) {
      if (patchjs.increment) { // 增量更新必须提供path，否则自动取消patchjs效果
        patchjs = false;
      } else { // 非增量更新本地可以开启cache
        patchjsPath = `http://${localhost}:${productionPort}/${options.appName}/`;
      }
    }
  }
  if (patchjs) {
    patchjs = {
      path: patchjsPath, // 默认为所处环境的请求路径
      validateVersion: false, // 验证当前打包的版本是否已经在path上
      increment: false, // 默认只启用缓存，不做增量更新
      count: 1, // 默认只缓存一个版本
      ...patchjs,
      waitDeps: patchjs.waitDeps ? [].concat(patchjs.waitDeps) : []
    };
    const patchjsLibPath = path.resolve(__dirname, `../../deps/patchjs/${patchjsConfig.version}`);
    inlineScripts = normalizeInlineSS([patchjsConfig.dbType + '.js', 'index.js'].map((filename) => {
      return path.resolve(patchjsLibPath, filename);
    })).concat(inlineScripts);
    // 生成额外依赖模板字符串表示
    let waitDepsTpl = patchjs.waitDeps.map((depName) => {
      return `load('${depName}')`;
    }).join('.');
    if (waitDepsTpl) {
      waitDepsTpl += '.';
    }
    patchBootstrap = `
      patchjs.config({
        cache: true,
        increment: ${patchjs.increment},
        count: ${patchjs.count},
        path: '${patchjs.path}',
        version: '${appVersion}',
        exceedQuotaErr: function (url) {
        }
      }).${waitDepsTpl}wait(function () {
        console.log('common done!');
      }).load('plus/js/main.js', function (url, fromCache) {
        console.log('index done!');
      });
    `;
  }

  // html template
  const htmlTemplate = {
    ...application.template,
    title: application.template.title || 'Yazuo App',
    inlineScripts,
    inlineStyles: normalizeInlineSS(application.template.inlineStyles)
  };
  // Delete template and templateContent, can't custom
  delete htmlTemplate.template;
  delete htmlTemplate.templateContent;
  // 处理资源引用
  ['scripts', 'links'].forEach((field) => {
    if (htmlTemplate[field]) {
      htmlTemplate[field] = htmlTemplate[field].map((item) => {
        if (item.slice(0, 2) === '@/') { // 以@开头的地址自动替换为资源目录地址
          return `${publicPath}${item.slice(2)}`;
        }
        return item;
      });
    }
  });

  let externalScripts = [];
  if (isNeedReact && !manualLoadReact) {
    if (optimizeReact) {
      const ext = mode === modeMap.PROD ? '.min.js' : '.js';
      externalScripts.push(`${publicPath}static/react/react-sets${ext}?v=${reactVersion}`);
    } else {
      // 按照以下地址可以在支付宝mobile客户端下走缓存 https://myjsapi.alipay.com/fe/preset-assets.html
      externalScripts.push('//as.alipayobjects.com/g/component/react/15.5.4/react.min.js');
      externalScripts.push('//as.alipayobjects.com/g/component/react/15.5.4/react-dom.min.js');
    }
  }
  // 附加vue statics
  if (!manualLoadVue) {
    if (optimizeVue) {
      ['vue'].forEach((filename) => {
        const pkgJson = fsExtra.readJsonSync(resolveDriverNpm(`${filename}/package.json`));
        const ext = mode === modeMap.PROD ? '.min.js' : '.js';
        const hashStr = ignoreRequestHash ? '' : `?v=${pkgJson.version}`;
        externalScripts.push(`${publicPath}static/vue/${filename}-sets${ext}${hashStr}`);
      });
    } else {
      ['vue', 'vuex', 'vue-router'].forEach((filename) => {
        // const pkgJson = fsExtra.readJsonSync(path.resolve(__dirname, `../../node_modules/${filename}/package.json`));
        const pkgJson = fsExtra.readJsonSync(resolveDriverNpm(`${filename}/package.json`));
        const ext = mode === modeMap.PROD ? '.min.js' : '.js';
        const hashStr = ignoreRequestHash ? '' : `?v=${pkgJson.version}`;
        externalScripts.push(`${publicPath}static/vue/${filename}${ext}${hashStr}`);
      });
    }
  }

  if (mode === modeMap.DEV && isNeedDll) {
    externalScripts.push(`${publicPath}dll/dll.js`);
  }

  const main = path.resolve(projectPath, './src/index.js'); // Use absolute path

  /**
   * 相对projectPath解析地址
   * @param {String} rp - relative path
   */
  const getRelativeProjectPath = (rp) => {
    return path.resolve(projectPath, rp);
  };

  /**
   * 检索出npm package地址
   * @param {String} name - npm name
   */
  // const resolveProjectNpm = (name) => {
  //   return require.resolve(name, {
  //     paths: [
  //       projectPath
  //     ]
  //   });
  // };

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
      loader: options.test ? styleLoaderName : (mode === modeMap.DEV ? styleLoaderName : MiniCssExtractPlugin.loader)
    }, {
      loader: 'css-loader',
      options: {
        importLoaders: 1, // 貌似意思是import语句给下面postcss-loader处理
        sourceMap: true
      }
    }, {
      loader: 'postcss-loader',
      options: {
        parser: 'postcss-safe-parser',
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

  /**
   * 获取预处理style loader
   * @param {String} preProcessor - style pre-processor name
   */
  const getStyleResourcesLoader = (preProcessor) => {
    let loaders = [];
    const ext = preProcessor === 'stylus' ? 'styl' : preProcessor;
    const presetStyleFilePath = path.resolve(projectPath, `src/app/preset.${ext}`);
    if (fs.existsSync(presetStyleFilePath)) {
      loaders.push({
        loader: 'sass-resources-loader',
        options: {
          resources: presetStyleFilePath
        }
      });
      log(`${presetStyleFilePath} load before any valid style processor`);
    }
    return loaders;
  };
  let pipe = (webpackConfig) => {
    return webpackConfig;
  };
  if (webpackConfigPipe) {
    const webpackConfigPipePath = path.resolve(projectPath, webpackConfigPipe);
    if (fs.existsSync(webpackConfigPipePath)) {
      pipe = require(webpackConfigPipePath);
    }
  }
  const {
    codeCoverage // Read code coverage configs
  } = application;
  // babel plugins
  const babelPlugins = ((() => {
    let plugins = [];
    let componentImportCfg = componentImportAsRequired;
    if (typeof componentImportCfg === 'string') { // js文件地址
      const componentImportCfgPath = path.resolve(projectPath, componentImportCfg);
      if (fs.existsSync(componentImportCfgPath)) {
        componentImportCfg = require(componentImportCfgPath)(); // Return array default
      } else {
        componentImportCfg = [];
      }
    }
    plugins = plugins.concat(componentImportCfg.map((cfg) => {
      return [
        'babel-plugin-import', {
          ...cfg
        }
      ];
    }));
    return plugins;
  })()).concat([
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

    // min lodash 经测试，webpack tree-shaking 已经给予lodash优化了
    ['babel-plugin-lodash']
  ]).concat((() => {
    let plugins = [];
    if (options.test) { // Unit test下插入coverage report
      plugins = plugins.concat([['babel-plugin-istanbul', {
        exclude: codeCoverage.exclude
      }]]);
    }
    return plugins;
  })()).map((plugin) => {
    plugin[0] = resolveDriverNpm(plugin[0], {
      builtIn: true
    });
    return plugin;
  });
  /**
   * Exclude file src from babel and eslint
   * @param {String} src - File path
   */
  const excludeBabelAndLint = function (src) {
    src = src.split('\\').join('/');
    if (src.search('src/deps/public') >= 0) { // 忽略/src/deps/public下文件转义和lint
      return true;
    }
    return false;
  };

  /**
   * Generate the output file name
   * @param {String} ext - file extension
   */
  const generateOutputName = (ext) => {
    if (!patchjs && !ignoreRequestHash) {
      return `[name].${ext}?v=[hash]`;
    } else {
      return `[name].${ext}`;
    }
  };

  const generateAssetName = () => {
    if (!ignoreRequestHash) {
      return `[name].[ext]?v=[hash]`;
    } else {
      return `[name].[ext]`;
    }
  };

  const webpackConfig = {
    mode,
    context,
    entry: {
      main
    },
    output: {
      path: outputPath,
      filename: `${filenameCommonPrefix}/js/${generateOutputName('js')}`,
      chunkFilename: `${filenameCommonPrefix}/js/${generateOutputName('js')}`,
      publicPath
    },
    devtool: mode === modeMap.DEV ? 'eval-source-map' : 'source-map', // chrome devtool更友好
    module: {
      rules: [{
        test: /\.(js|vue)$/,
        include: [
          getRelativeProjectPath('src')
        ],
        exclude: excludeBabelAndLint,
        enforce: 'pre',
        use: [{
          loader: 'eslint-loader',
          options: {
            useEslintrc: false, // 只遵循configFile指定的规则
            configFile: getRelativeDriverPath('config/webpack/loaders/eslint/eslintrc'),
            ignorePath: getRelativeDriverPath('config/webpack/loaders/eslint/eslintignore'),
            formatter: require('eslint-friendly-formatter'),
            ...eslintConfigs
          }
        }]
      }, {
        test: /\.vue$/,
        use: [{
          loader: 'vue-loader'
        }]
      }, {
        test: /\.js$/,
        include: function (src) {
          src = src.split('\\').join('/');
          if (src.search('node_modules') === -1) { // 非node_modules都走转义
            return true;
          } else {
            // node_modules目录下除了vars.js下npmOnbabel定义开头的包，其它都不走babel转义
            if (npmOnBabel.some((pkgPrefix) => {
              if (src.search(`node_modules/${pkgPrefix}`) >= 0) {
                if (src.search('element-ui') >= 0) {
                  throw new Event('error');
                }
                return true;
              }
            })) {
              return true;
            } else {
              return false;
            }
          }
        },
        exclude: excludeBabelAndLint,
        use: [{ // TODO:// !important thread-loader 配合babel-loader使用有bug，会使babel plugin 的自定义配置项非基本类型的配置丢失，比如babel-plugin-import 里的customName配置项因为是函数类型，传到插件里丢失了
          loader: 'babel-loader',
          options: {
            sourceType: 'unambiguous', // !important，缺失设置会导致失败
            presets: [['@babel/preset-env', {
              modules: false, // Leave for webpack
              targets: browserslist,
              useBuiltIns: 'usage' // entry == Replace @babel/polyfill with needed polyfills https://github.com/zloirock/core-js
              // usage == adds at the top of each file imports of polyfills for features used in this file. In this case, feature detection is not perfect. Also, import of polyfills not at the top of your entry point can cause problems.
            }], ['@babel/preset-react'], ['@babel/preset-flow']].map((preset) => {
              preset[0] = resolveDriverNpm(preset[0]);
              return preset;
            }),
            plugins: babelPlugins
            // cacheDirectory: modeMap.DEV === mode // development下生效，TODO:// 貌似会把babel-plugin cache ?
          }
        }]
      }, {
        test: /\.css$/,
        use: getStyleLoaderPresets('css').concat(getStyleResourcesLoader('css'))
      }, {
        test: /\.styl(us)?$/,
        use: getStyleLoaderPresets('stylus').concat({
          loader: 'stylus-loader',
          options: {
            sourceMap: true
          }
        }).concat(getStyleResourcesLoader('stylus'))
      }, {
        test: /\.less?$/,
        use: getStyleLoaderPresets('less').concat({
          loader: 'less-loader',
          options: {
            sourceMap: true
          }
        }).concat(getStyleResourcesLoader('less'))
      }, {
        test: /\.(sass|scss)(\?.*)?$/,
        use: getStyleLoaderPresets('sass').concat({
          loader: 'sass-loader',
          options: {
            sourceMap: true
          }
        }).concat(getStyleResourcesLoader('sass'))
      }, {
        test: /\.html$/,
        loader: 'html-loader'
      }, {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 1024,
          name: `${filenameCommonPrefix}/img/${generateAssetName()}`
        }
      }, {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 1024,
          name: `${filenameCommonPrefix}/media/${generateAssetName()}`
        }
      }, {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 1024,
          name: `${filenameCommonPrefix}/fonts/${generateAssetName()}`
        }
      }]
    },
    resolve: {
      alias: {
        // '@babel': getRelativeDriverPath('node_modules/@babel'), // Force @babel resolve through driver
        '@babel': resolveDriverNpm('@babel', {
          defaultReturn: true
        }), // Force @babel resolve through driver
        'core-js': resolveDriverNpm('core-js', {
          defaultReturn: true
        }),
        'regenerator-runtime': resolveDriverNpm('regenerator-runtime', {
          defaultReturn: true
        }),
        'react$': getRelativeDriverPath('deps/react/15.5.4/react.js'),
        'react-dom$': getRelativeDriverPath('deps/react/15.5.4/react-dom.js'),
        'vue$': resolveDriverNpm('vue/dist/vue.esm.js', {
          defaultReturn: true
        }),
        'vuex$': resolveDriverNpm('vuex/dist/vuex.esm.js', {
          defaultReturn: true
        }),
        'vue-router$': resolveDriverNpm('vue-router/dist/vue-router.esm.js', {
          defaultReturn: true
        }),
        '@vue/test-utils': resolveDriverNpm('@vue/test-utils', {
          defaultReturn: true
        }),
        'chai': resolveDriverNpm('chai', {
          defaultReturn: true
        }),
        'sinon': resolveDriverNpm('sinon', {
          defaultReturn: true
        }),
        '+': resolveProjectNpm('ya-turbine/src/packages/generic', {
          defaultReturn: true
        }),
        '@': getRelativeProjectPath('src'),
        'ya-ui-vue': resolveProjectNpm('ya-ui-vue', {
          defaultReturn: true
        }) // For npm link情况，强制指向本项目下ya-ui-vue
      },
      extensions: ['.wasm', '.mjs', '.js', '.vue', '.json']
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      'vue': 'Vue',
      'vuex': 'Vuex',
      'vue-router': 'VueRouter'
    },
    plugins: [
      new webpack.ContextReplacementPlugin(
        /moment[\/\\]locale$/, // eslint-disable-line
        /zh-cn/
      ),
      new VueLoaderPlugin(),
      new HtmlWebpackPlugin(merge({
        appMountId: 'app', // Dom container id
        mobile: true
      }, htmlTemplate, {
        inject: false,
        filename: mode === modeMap.DEV ? 'index.html' : path.resolve(distPath, 'index.html'), // Ouput the root of dist
        template: path.resolve(__dirname, '../template.ejs'),
        window: {
          APP_DOMAIN: options.appDomain, // 部署域名
          APP_NAME: options.appName, // 项目二级path名
          APP_ENV: options.appEnv, // 部署环境
          APP_VERSION: appVersion, // 项目版本号
          STATIC_PATH: staticPath, // 静态目录伺服地址，同域下
          STATIC_CDN: staticCDN // 静态目录伺服地址，通过cdn请求，会造成跨域问题，注意请求地址后手动添加版本号
        },
        scripts: (htmlTemplate.scripts || []).concat(externalScripts),
        patchjs: patchBootstrap
      }))
    ].concat((() => {
      let plugins = [];
      if (!options.test) { // Unit test下不加载多余plugin
        if (mode === modeMap.PROD) { // 生产环境css提取
          plugins = [
            new MiniCssExtractPlugin({
              // filename: `${filenameCommonPrefix}/css/[name].css?v=[contenthash]`
              filename: `${filenameCommonPrefix}/css/${generateOutputName('css')}`
            })
          ];
          if (options.appEnv === 'local') {
            plugins.push(new BundleAnalyzerPlugin({
              openAnalyzer: !ipcEnabled // ya-gui下单独处理analyzer展示
            })); // Local test
          }
          if (removeStrictFlag) { // 兼容模式去掉 strict flag
            plugins = plugins.concat([
              new RemoveStrictFlagPlugin()
            ]);
          }
          if (patchjs) {
            plugins = plugins.concat([new PatchjsWebpackPlugin(patchjs)]);
          }
        } else if (mode === modeMap.DEV) {
          plugins = [
            new webpack.HotModuleReplacementPlugin() // Hot replace
          ];
          if (isNeedDll) {
            plugins.push(new webpack.DllReferencePlugin({
              context: projectPath, // !important
              manifest: path.resolve(dllPath, './dll-manifest.json')
            }));
          }
          if (removeStrictFlag) { // 兼容模式去掉 strict flag
            plugins.push(new RemoveStrictFlagPlugin());
          }
        } else {
          plugins = [];
        }
      }
      // Common
      plugins = plugins.concat([
        new ParseAtFlagPlugin(),
        new CaseSensitivePathsPlugin()
      ]);
      return plugins;
    })())
  };
  // Return configs
  return pipe(webpackConfig);
};
