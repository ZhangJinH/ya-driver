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
  escapeBufferLog,
  ipcEnabled,
  processSendSilent
} = require('../utils/helper');

module.exports = function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  const {
    pkgJson,
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
    /**
     * Handle ipc message
     * @param {boolean} first - Is first
     */
    const handleIpc = (first) => {
      if (ipcEnabled) {
        const templateUri = `${jsdocCfg.destination}/${pkgJson.name}/${pkgJson.version}/index.html`;
        log(`请切换到 API documentation 面板查看详细`);
        if (first) {
          processSendSilent({
            action: 'initialized',
            data: {
              templateUri
            }
          });
        }
        processSendSilent({
          action: 'completed',
          data: {
            templateUri
          }
        });
      }
    };
    // Render
    const spawnHandler = spawnSync(nodeLibBin, jsdocArgs(files));
    if (handleSpawn(spawnHandler)) {
      log(`API documents output at ${jsdocCfg.destination}`);
      handleIpc(true);
      if (watchMode) { // watch mode
        const watcher = chokidar.watch(jsdocCfg.files, {
          ignored: /(^|[/\\])\../,
          persistent: true
        });
        let lazyTid = null;
        watcher.on('change', (filePath) => {
          // const spawnHandler = spawnSync(nodeLibBin, jsdocArgs(filePath)); // 单独编译会破坏index.html结构
          clearTimeout(lazyTid);
          lazyTid = setTimeout(() => {
            const spawnHandler = spawnSync(nodeLibBin, jsdocArgs(files)); // TODO: 单独文件变动会编译整个doc体系，性能低下
            if (handleSpawn(spawnHandler)) {
              log(`${filePath} changed, API documents rerender completed`);
              handleIpc(false);
            }
          }, 130);
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
