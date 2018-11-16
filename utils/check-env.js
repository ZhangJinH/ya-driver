/**
 * Check the execution environment
 */
const shell = require('shelljs');
const os = require('os');
const osType = os.type();
const commandPrefix = (osType === 'Darwin' ? '/usr/local/bin/' : '');
module.exports = {
  ready() {
    let preferInstallCMD = ''; // yarn or npm
    /**
     * Check CMD exist
     * @param {String} name - CMD
     * @param {String} versionArg - Arguments
     */
    const check = (name, versionArg) => {
      const isTrue = shell.which(name);
      if (isTrue) {
        const version = shell.exec(`${name} ${versionArg}`, {
          silent: true
        });
        return (version.stdout || version.stderr).trim();
      } else {
        return 'invalid';
      }
    };
    const envCommands = [{
      name: `${commandPrefix}git`,
      version: '--version',
      check
    }, /* {
      name: 'python',
      version: '--version',
      check
    }, */ {
      name: `${commandPrefix}yarn|${commandPrefix}npm`,
      version: '-v|-v',
      check: (name, versionArg) => {
        const names = name.split('|');
        const versions = versionArg.split('|');
        return names.map((name, i) => {
          const version = check(name, versions[i]);
          if (version !== 'invalid' && !preferInstallCMD) {
            preferInstallCMD = name; // 优先yarn
          }
          return version;
        }).join('|');
      }
    }];
    return {
      envCommands: envCommands.map((item) => {
        item = {
          ...item,
          version: item.check(item.name, item.version)
        };
        delete item.check;
        return item;
      }),
      preferInstallCMD
    };
  }
};
