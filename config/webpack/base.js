/**
 * The base webpack config
 */
const path = require('path');

module.exports = function (options) {
  const {
    projectPath
  } = options;
  const main = path.resolve(projectPath, './src/index.js');
  return {
    entry: {
      main
    },
    resolve: {
      alias: {
        '+': path.resolve(projectPath, './node_modules/ya-spa-vue/ya'),
        '@': path.resolve(projectPath, './src')
      }
    }
  };
};
