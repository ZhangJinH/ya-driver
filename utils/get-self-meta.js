/**
 * Get self relative meta
 */
const pkgJson = require('../package.json');
const semver = require('semver');
const getRemotePackageVersion = require('@vue/cli/lib/util/getPackageVersion');

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
    const res = await getRemotePackageVersion(`${pkgJson.name}`, 'latest');
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
