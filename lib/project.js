/**
 * Export project singleton
 */
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');

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
  get dllPath() {
    const dp = path.resolve(this.projectPath, `./dll`);
    fsExtra.ensureDirSync(dp);
    return dp;
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
    return this.pkgJson.application;
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
    return fs.existsSync(path.resolve(this.projectPath, './dll'));
  }
}
