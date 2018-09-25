/**
 * Static files serve & build
 */
const path = require('path');
const fsExtra = require('fs-extra');
const fs = require('fs');
const Project = require('./project');
const {
  log
} = require('../utils/log');

module.exports = {
  /**
   * 预设static files
   * @param {Object} options - configs
   */
  preset(options) {
    const {
      projectPath
    } = options;
    const project = new Project(projectPath);
    const {
      srcPath
    } = project;
    const srcStaticPath = path.resolve(srcPath, './deps/public');
    fsExtra.ensureDirSync(srcStaticPath); // 保证存在
    // 判断vue相关文件是否存在vue目录下，不存在的话copy进去
    ['vue', 'vuex', 'vue-router'].forEach((filename) => {
      const filePathPrefix = path.resolve(srcStaticPath, `./vue/${filename}`);
      const npmFilePathPrefix = path.resolve(__dirname, `../node_modules/${filename}/dist/${filename}`);
      const pkgJson = fsExtra.readJsonSync(path.resolve(__dirname, `../node_modules/${filename}/package.json`));
      ['.js', '.min.js'].forEach((ext) => {
        const filePath = `${filePathPrefix}${ext}`;
        const npmFilePath = `${npmFilePathPrefix}${ext}`;
        if (!fs.existsSync(filePath)) {
          fsExtra.copySync(npmFilePath, filePath);
          log(`${npmFilePath}(${pkgJson.version}) present now.`);
        } else {
          log(`${npmFilePath} already exist`);
        }
      });
    });
    return {
      srcStaticPath // 返回/src下static路径
    };
  },
  /**
   * Build process
   * @param {Object} options - configs
   */
  build(options) {
    const {
      projectPath
    } = options;
    const project = new Project(projectPath);
    const {
      outputPath,
      srcPath
    } = project;
    // copy static files to dist
    const srcStaticPath = path.resolve(srcPath, './deps/public');
    const distStaticPath = path.resolve(outputPath, './static');
    fsExtra.copySync(srcStaticPath, distStaticPath);
  }
};
