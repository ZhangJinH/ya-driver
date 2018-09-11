/**
 * Preset variables
 */
module.exports = {
  // Default npm registry
  registry: 'https://registry.npm.taobao.org',
  templateUri: 'q13/ya-template-vue', // template github url
  npmOnBabel: [ // node_modules中走babel转义的包名前缀
    'ipos',
    'air',
    'kbpos',
    'ya'
  ],
  modeMap: { // Support mode list
    DEV: 'development',
    PROD: 'production',
    SDK: 'sdk'
  },
  browserslist: 'last 2 versions", "last 3 iOS versions", "not ie <= 8", "Android >= 4.4', // Support browser list
  filenameCommonPrefix: 'plus' // 输出文件前缀
};
