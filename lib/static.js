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
const {
  reactVersion
} = require('../config/vars');
const {
  resolveDriverNpm
} = require('../utils/helper');

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
      // const npmFilePathPrefix = path.resolve(__dirname, `../node_modules/${filename}/dist/${filename}`);
      // const pkgJson = fsExtra.readJsonSync(path.resolve(__dirname, `../node_modules/${filename}/package.json`));
      const npmFilePathPrefix = resolveDriverNpm(`${filename}/dist/${filename}`, {
        extensions: ['js']
      });
      const pkgJson = fsExtra.readJsonSync(resolveDriverNpm(`${filename}/package.json`));
      ['.js', '.min.js'].forEach((ext) => {
        const filePath = `${filePathPrefix}${ext}`;
        const npmFilePath = `${npmFilePathPrefix}${ext}`;
        if (!fs.existsSync(filePath)) {
          fsExtra.copySync(npmFilePath, filePath);
          log(`${filePath}(${pkgJson.version}) present now.`);
        } else {
          log(`${filePath} already exist`);
        }
      });
    });
    // vue相关合并成一个文件
    ['.js', '.min.js'].forEach((ext) => {
      const fileSetsPath = path.resolve(srcStaticPath, `./vue/vue-sets${ext}`);
      if (!fs.existsSync(fileSetsPath)) {
        let content = ''; // Text拼接
        ['vue', 'vuex', 'vue-router'].forEach((filename) => {
          content += fs.readFileSync(path.resolve(srcStaticPath, `./vue/${filename}${ext}`), 'utf8') + '\n';
        });
        fs.writeFileSync(fileSetsPath, content, 'utf8');
        log(`${fileSetsPath} present now.`);
      } else {
        log(`${fileSetsPath} already exist`);
      }
    });

    // React copy merge
    ['react', 'react-dom'].forEach((filename) => {
      const filePathPrefix = path.resolve(srcStaticPath, `./react/${filename}`);
      const sourcePathPrefix = path.resolve(__dirname, `../deps/react/${reactVersion}/${filename}`);
      ['.js', '.min.js'].forEach((ext) => {
        const filePath = `${filePathPrefix}${ext}`;
        const sourceFilePath = `${sourcePathPrefix}${ext}`;
        if (!fs.existsSync(filePath)) {
          fsExtra.copySync(sourceFilePath, filePath);
          log(`${filePath}(${reactVersion}) present now.`);
        } else {
          log(`${filePath} already exist`);
        }
      });
    });
    ['.js', '.min.js'].forEach((ext) => {
      const fileSetsPath = path.resolve(srcStaticPath, `./react/react-sets${ext}`);
      if (!fs.existsSync(fileSetsPath)) {
        let content = ''; // Text拼接
        ['react', 'react-dom'].forEach((filename) => {
          content += fs.readFileSync(path.resolve(srcStaticPath, `./react/${filename}${ext}`), 'utf8') + '\n';
        });
        fs.writeFileSync(fileSetsPath, content, 'utf8');
        log(`${fileSetsPath} present now.`);
      } else {
        log(`${fileSetsPath} already exist`);
      }
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
