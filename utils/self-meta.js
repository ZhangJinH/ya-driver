/**
 * Get self relative meta
 */
const fsExtra = require('fs-extra');
const path = require('path');
const semver = require('semver');
const request = require('request-promise-native');
const {
  registry
} = require('../config/vars');

const pkgJsonPath = path.resolve(__dirname, '../package.json');

const getPkgJson = function () {
  return fsExtra.readJsonSync(pkgJsonPath);
};

module.exports = {
  /**
   * Get local package.json data
   */
  getPkgJson,
  savePkgJson(data) {
    fsExtra.writeJsonSync(pkgJsonPath, {
      ...getPkgJson(),
      ...(data || {})
    }, {
      spaces: 2
    });
  },
  /**
   * Get local package.name
   */
  getVersion() {
    const pkgJson = getPkgJson();
    return pkgJson.version;
  },
  /**
   * Get the remote pkg latest version
   */
  async getLatestVersion() {
    const pkgJson = getPkgJson();
    const res = await request({
      method: 'GET',
      resolveWithFullResponse: true, // real content in body
      json: true,
      uri: `${registry}/${encodeURIComponent(pkgJson.name).replace(/^%40/, '@')}/latest`
    });
    if (res.statusCode === 200) {
      const { version } = res.body;
      if (semver.valid(version)) {
        return version;
      } else {
        return 'Invalid version';
      }
    }
  }
};
