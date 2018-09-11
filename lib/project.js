/**
 * Export project singleton
 */
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');

module.exports = class Project {
  constructor(projectPath) {
    if (!Project.singleton) {
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
  get outputPath() {
    const pkgJson = this.pkgJson;
    const op = path.resolve(this.projectPath, `./dist/${pkgJson.version}`);
    fsExtra.ensureDirSync(op); // Promise exist
    return op;
  }
  get appName() {
    return this.pkgJson.name;
  }
  get appVersion() {
    return this.pkgJson.version;
  }
}
