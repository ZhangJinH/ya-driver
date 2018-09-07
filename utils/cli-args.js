/**
 * Normalize cli args
 */
const path = require('path');

module.exports = function (projectName, cmd) {
  const projectPath = path.isAbsolute(projectName) ? projectName : path.resolve(process.cwd(), projectName);
  // const projectContext = path.dirname(projectPath);
  projectName = path.basename(projectPath); // normalize project name
  let options = getCleanArgs(cmd);
  // options.context = projectContext;
  options.projectPath = projectPath;
  options.projectName = projectName;
  return options;
};

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function getCleanArgs (cmd) {
  let args = {};
  cmd.options.forEach(o => {
    const key = o.long.replace(/^--/, '');
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key];
    }
  });
  return args;
}
