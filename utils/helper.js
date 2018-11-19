/**
 * Some helper utils
 */
const path = require('path');
const fs = require('fs');

module.exports = {
  processSendSilent(data) {
    return process.send && process.send(data);
  },
  get ipcEnabled() {
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
  },
  /**
   * 判定port是否被占用
   * @param {Number} port - port
   * @param {Function} fn - callback
   */
  isPortTaken(port, fn) {
    const net = require('net');
    const tester = net.createServer().once('error', function (err) {
      if (err.code !== 'EADDRINUSE') {
        return fn(err);
      }
      fn(null, true);
    }).once('listening', function () {
      tester.once('close', function () {
        fn(null, false);
      }).close();
    }).listen(port);
  },
  /**
   * Get absolute file path
   * @param {String} pp - The project path
   * @param {String} rp - The project file relative path
   */
  getAbsProjectFilePath(pp, rp) {
    let absPath = '';
    if (rp.slice(0, 2) === '@/') {
      absPath = path.resolve(pp, 'src', rp.slice(2));
    } else {
      absPath = path.resolve(pp, rp);
    }
    if (fs.existsSync(absPath)) { // Must exist
      return absPath;
    } else {
      return '';
    }
  }
};
