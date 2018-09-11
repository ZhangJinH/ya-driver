/**
 * Get self relative meta
 */
const pkgJson = require('../package.json');
const semver = require('semver');
const request = require('request-promise-native');
const {
  registry
} = require('../config/vars');

module.exports = {
  /**
   * Get local package.json data
   */
  getPkgJson() {
    return pkgJson;
  },
  /**
   * Get local package.name
   */
  getVersion() {
    return pkgJson.version;
  },
  /**
   * Get the remote pkg latest version
   */
  async getLatestVersion() {
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
