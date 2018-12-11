/**
 * Export jsdoc configure
 */
const path = require('path');

module.exports = {
  tags: {
    allowUnknownTags: true,
    dictionaries: ['jsdoc']
  },
  templates: {
    cleverLinks: false,
    monospaceLinks: true,
    useLongnameInNav: false,
    showInheritedInNav: true
  },
  plugins: [
    'plugins/markdown',
    'node_modules/jsdoc-vuejs'
  ].map((rp) => {
    if (rp.slice(0, 13) === 'node_modules/') {
      return path.resolve(__dirname, `../${rp}`)
    } else {
      return rp;
    }
  }),
  source: {
    includePattern: '\\.(vue|js)$'
  },
  opts: {
    encoding: 'utf8',
    recurse: true,
    template: path.resolve(__dirname, '../node_modules/minami')
  }
};
