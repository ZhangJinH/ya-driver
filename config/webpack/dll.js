/**
 * Dll extract
 */
const path = require('path');
const webpack = require('webpack');
const fsExtra = require('fs-extra');
const fs = require('fs');
const Project = require('../../lib/project');
const {
  modeMap
} = require('../vars');

const defaultDlls = [
  'lodash',
  'moment',
  'vue-beauty',
  'iview',
  'element-ui',
  'mint-ui',
  'axios',
  'store',
  'antd',
  'antd-mobile',
  '@antv/g2',
  '@antv/f2',
  '@antv/g',
  '@antv/g6',
  '@antv/data-set',
  '@antv/hierarchy'
];

module.exports = function (options) {
  const {
    projectPath
  } = options;
  const project = new Project(projectPath); // 放置project相关信息
  const {
    dllPath
  } = project;
  fsExtra.ensureDirSync(dllPath); // DLL目录，开发阶段存储打包dll文件
  fsExtra.emptyDirSync(dllPath);
  // Find all project deps
  const dll = defaultDlls.filter((name) => {
    return fs.existsSync(path.resolve(projectPath, `./node_modules/${name}`));
  });
  return {
    mode: modeMap.DEV,
    context: projectPath,
    output: {
      path: dllPath,
      filename: '[name].js',
      library: '[name]_[hash]',
      libraryTarget: 'umd',
      umdNamedDefine: true
    },
    entry: {
      dll
    },
    devtool: 'source-map', // chrome devtool更友好
    externals: {
      'react': 'React',
      'react-dom': 'ReactDOM',
      'vue': 'Vue',
      'vuex': 'Vuex',
      'vue-router': 'VueRouter'
    },
    plugins: [
      new webpack.DllPlugin({
        path: path.resolve(dllPath, '[name]-manifest.json'),
        name: '[name]_[hash]' // !important
      })
    ]
  };
};
