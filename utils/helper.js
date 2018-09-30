/**
 * Some helper utils
 */
const path = require('path');
const fs = require('fs');

module.exports = {
  processSendSilent(data) {
    return process.send && process.send(data);
  },
  ipcEnabled() {
    return !!process.send;
  },
  resolveDriverNpm(name, options) {
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
    let basePath = path.resolve(__dirname, '../');
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
};
