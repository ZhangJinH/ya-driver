/**
 * JSDoc configuration
 */
const Project = require('../lib/project');
const {
  getAbsProjectFilePath
} = require('../utils/helper');
const glob = require('glob');

module.exports = function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  const {
    application
  } = project;
  let {
    files
  } = application.jsdoc;
  files = [].concat(files);
  // 替换@ short flag
  files = files.reduce((pv, cv) => {
    if (typeof cv === 'string') {
      const filePath = getAbsProjectFilePath(options.projectPath, cv);
      if (filePath) {
        pv = pv.concat(filePath);
      }
    } else { // 支持 { pattern: '*' } 方式
      const result = glob.sync(cv.pattern, {
        cwd: options.projectPath,
        absolute: true // Need absolute path
      });
      if (result.length) {
        pv = pv.concat(result);
      }
    }
    return pv;
  }, []);

  // Assemble configuration
  const cfg = {
    ...application.jsdoc,
    files
  };
  return cfg;
};
