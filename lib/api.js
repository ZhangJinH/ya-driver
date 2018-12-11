/**
 * API documents renderer
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const getJsdocCfg = require('../config/jsdoc');
const chokidar = require('chokidar');
const Project = require('./project');
const {
  log,
  error
} = require('../utils/log');
const {
  jsdocBin,
  jsdocConf
} = require('../config/vars');
const {
  escapeBufferLog
} = require('../utils/helper');

module.exports = function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  const {
    pkgJsonPath
  } = project;
  const jsdocCfg = getJsdocCfg(options);
  const watchMode = jsdocCfg.watch;

  delete jsdocCfg.watch;
  const files = jsdocCfg.files;
  if (files.length) {
    const nodeLibBin = options.nodeLibBin;
    const jsdocArgs = (files) => {
      return [jsdocBin].concat(files).concat([
        '--destination',
        jsdocCfg.destination,
        '--configure',
        jsdocConf,
        '--package',
        pkgJsonPath
      ]).concat((() => {
        // 如果readme.md存在，包含进来
        const readmePath = path.resolve(options.projectPath, './README.md');
        if (fs.existsSync(readmePath)) {
          return ['--readme', readmePath];
        }
        return [];
      })());
    };
    // Render
    const spawnHandler = spawnSync(nodeLibBin, jsdocArgs(files));
    if (handleSpawn(spawnHandler)) {
      log(`API documents output at ${jsdocCfg.destination}`);
      if (watchMode) { // watch mode
        const watcher = chokidar.watch(jsdocCfg.files, {
          ignored: /(^|[/\\])\../,
          persistent: true
        });
        watcher.on('change', (filePath) => {
          // const spawnHandler = spawnSync(nodeLibBin, jsdocArgs(filePath)); // 单独编译会破坏index.html结构
          const spawnHandler = spawnSync(nodeLibBin, jsdocArgs(files)); // TODO: 单独文件变动会编译整个doc体系，性能低下
          if (handleSpawn(spawnHandler)) {
            log(`${filePath} changed, API documents rerender completed`);
          }
        });
      }
    }
  } else {
    error('There are no source files found');
  }
};

/**
 * Handle spawn return
 * @param {Object} handler - spawn return
 */
function handleSpawn(handler) {
  let {
    stderr
  } = handler;
  stderr = escapeBufferLog(stderr);
  if (stderr) {
    error(stderr);
    return false;
  } else {
    return true;
  }
}
