/**
 * Export project singleton
 */
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const {
  merge
} = require('lodash');
const {
  defaultDevServerPort,
  defaultProdServerPort,
  defaultProxyTable
} = require('../config/vars');

module.exports = class Project {
  constructor(projectPath) {
    if (!Project.singleton || Project.singleton.projectPath !== projectPath) { // 单例模式，除非下一次projectPath不一样才更新
      this.projectPath = projectPath;
      const pkgJsonPath = path.resolve(this.projectPath, './package.json');
      if (!fs.existsSync(pkgJsonPath)) {
        throw new Error(`${pkgJsonPath} not exist`);
      }
      this.pkgJsonPath = pkgJsonPath;
      Project.singleton = this;
    }
    this.resolveProjectNpm = this.resolveProjectNpm.bind(Project.singleton);
    this.savePkgJson = this.savePkgJson.bind(Project.singleton);
    return Project.singleton;
  }
  get pkgJson() {
    return fsExtra.readJsonSync(this.pkgJsonPath);
  }
  get srcPath() {
    return path.resolve(this.projectPath, './src');
  }
  get outputPath() {
    const pkgJson = this.pkgJson;
    const op = path.resolve(this.projectPath, `./dist/${pkgJson.version}`);
    fsExtra.ensureDirSync(op); // Promise exist
    return op;
  }
  get distPath() {
    const dp = path.resolve(this.projectPath, `./dist`);
    fsExtra.ensureDirSync(dp); // Promise exist
    return dp;
  }
  get coveragePath() {
    const dp = path.resolve(this.projectPath, `./coverage`);
    fsExtra.ensureDirSync(dp); // Promise exist
    return dp;
  }
  get dllPath() {
    const dp = path.resolve(this.projectPath, `./dll`);
    fsExtra.ensureDirSync(dp);
    return dp;
  }
  get mockPath() {
    const mp = path.resolve(this.projectPath, `./src/mock`);
    fsExtra.ensureDirSync(mp);
    return mp;
  }
  get appName() {
    return this.pkgJson.name;
  }
  get appVersion() {
    return this.pkgJson.version;
  }
  /**
   * Get app data
   */
  get application() {
    return merge({
      devPort: defaultDevServerPort,
      productionPort: defaultProdServerPort,
      template: {
        htmlClassNames: '',
        bodyClassNames: '',
        inlineScripts: [],
        inlineStyles: []
      },
      build: {
        optimizeVue: false, // Combine vue relevant file to single file
        optimizeReact: false, // Combine vue relevant file to single file
        singleStyleFile: false, // Need merge one single style file，default is false
        optimizeStyle: false, // Need with  optimize-css-assets-webpack-plugin, default is false
        webpackConfigPipe: '', // Project webpack config pipe
        removeStrictFlag: true, // Remove strict flag from js file
        localNoCompress: false, // Local build no compress
        manualLoadReact: false, // Load react libs manually
        manualLoadVue: false, // Load vue libs manually, default false
        cdnDisabled: false, // Enable CDN default
        componentImportAsRequired: [], // Babel-plugin-import settings https://github.com/ant-design/babel-plugin-import
        ignoreMapOutput: false, // Ignore .map files
        patchjs: false, // Enable patchjs or not，the configs from https://github.com/patchjs/patchjs-webpack-plugin. If patchjs enabled, cdnDisabled must be true
        verifyVersion: false, // Enable semver validation or not
        ignoreRequestHash: false // True means no hash at request url
      },
      proxyTable: defaultProxyTable,
      karma: { // karma config
        port: 9876,
        browsers: ['ChromeHeadless'] // Run unit test backend default
      },
      codeCoverage: {
        exclude: []
      },
      serviceWorker: '' // Service worker script file path
    }, (this.pkgJson.application || {}));
  }
  /**
   * Get eslintrc configs
   * 注意eslintrc里的配置field遵循nodeJs api传递风格 https://eslint.org/docs/developer-guide/nodejs-api#cliengine
   */
  get eslintConfigs() {
    const fp = path.resolve(this.projectPath, './.eslintrc.harmony');
    if (fs.existsSync(fp)) {
      return fsExtra.readJsonSync(fp);
    } else {
      return {};
    }
  }
  get isNeedReact() {
    let deps = this.pkgJson.dependencies;
    if (deps['react'] || deps['antd'] || deps['antd-mobile']) {
      return true;
    }
    return false;
  }
  /**
   * 判定是否需要Dll加持
   */
  get isNeedDll() {
    return fs.existsSync(path.resolve(this.projectPath, './dll/dll-manifest.json'));
  }
  /**
   * 检索项目内npm包地址
   * @param {String} name - npm name
   */
  resolveProjectNpm(name, options) {
    // return require.resolve(name, {
    //   paths: [
    //     this.projectPath
    //   ]
    // });
    options = {
      builtIn: false,
      defaultReturn: false,
      extensions: [],
      ...(options || {})
    };
    const {
      builtIn,
      defaultReturn,
      extensions
    } = options;
    let basePath = this.projectPath;
    const defaultPath = path.resolve(basePath, `node_modules/${name}`);
    if (builtIn) {
      try {
        return require.resolve(name, {
          paths: [
            basePath
          ]
        });
      } catch (evt) {
        return defaultReturn ? defaultPath : ''
      }
    } else {
      let targetPath = defaultPath;
      while (extensions.length ? !extensions.some((ext) => {
        return fs.existsSync(`${targetPath}.${ext}`);
      }) : !fs.existsSync(targetPath)) {
        // console.log('project-base', basePath);
        // console.log('project-target', targetPath);
        let newBasePath = path.dirname(basePath);
        if (newBasePath && newBasePath !== basePath) {
          basePath = newBasePath;
          targetPath = path.resolve(basePath, `node_modules/${name}`);
        } else {
          return defaultReturn ? defaultPath : '';
        }
      }
      return targetPath;
    }
  }
  /**
   * Save package.json data
   * @param {Object} data - package.json data
   */
  savePkgJson(data) {
    fsExtra.writeJsonSync(this.pkgJsonPath, {
      ...this.pkgJson,
      ...(data || {})
    }, {
      spaces: 2
    });
  }
}
