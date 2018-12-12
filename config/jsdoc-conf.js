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
    require.resolve('jsdoc-vuejs')
  ],
  source: {
    includePattern: '\\.(vue|js)$'
  },
  opts: {
    encoding: 'utf8',
    recurse: true,
    // template: path.resolve(__dirname, '../node_modules/minami')
    template: path.dirname(require.resolve('minami'))
  }
};
