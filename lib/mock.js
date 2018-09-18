/**
 * Setup mock server
 */
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const Mock = require('mockjs');
const rapnode = require('rap-node-plugin');
const Project = require('./project');
const {
  defaultMockServerPort,
  localhost
} = require('../config/vars');
const {
  log
} = require('../utils/log');

module.exports = function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  const {
    mockPath,
    application
  } = project;
  const dataSourceDir = mockPath;

  const mockApp = express();

  mockApp.use(bodyParser.json({
    limit: '1mb'
  })); // 这里指定参数使用 json 格式
  mockApp.use(bodyParser.urlencoded({
    extended: true
  }));

  // Ya Remote mock
  const rapConfig = {
    host: '192.168.49.96', // 启动的服务主机
    port: '10010', // 端口号
    //  mock: '/mymockjsurl/', // RAP前缀
    wrapper: '' // 不需要包装
  };

  global.RAP_FLAG = 1; // 开启RAP

  function mockToRap(req, res) {
    const projectId = req.query.projectId || req.body.projectId;
    // 如果请求地址包含.json
    // if(/\.json/.test(req.url)) {
    if (!projectId) {
      let data = '{}';
      let filePath = dataSourceDir + '/' + req.url + '.js';
      try {
        data = fs.readFileSync(filePath, 'utf8');
      } catch (evt) {
        filePath = dataSourceDir + '/' + req.url + '.json';
        data = fs.readFileSync(filePath, 'utf8');
      }
      // 自定义mock数据占位符
      Mock.Random.extend({
        requestBody: function () {
          return req.body;
        }
      });
      // eval方式解析处理复杂数据类型
      data = eval('(' + data + ')'); // eslint-disable-line
      // 将req.body插入到每一个含有Funciton类型的deep对象里
      const insertDeep = function (data) {
        Object.keys(data).forEach((key) => {
          if (Object.prototype.toString.call(data[key]) === '[object Function]') {
            data['__request_body__'] = req.body;
          }
          if (Object.prototype.toString.call(data[key]) === '[object Object]') {
            insertDeep(data[key]);
          }
          if (Object.prototype.toString.call(data[key]) === '[object Array]') {
            data[key].forEach((item) => {
              insertDeep(data[key]);
            });
          }
        })
      };
      insertDeep(data);

      res.json(Mock.mock(data));
      // let data = require('./mock' + req.url.replace(/\/mock/g, ''))
      // if(data) res.json(data)
    } else {
      // mock数据并输出
      rapnode.getRapData(Object.assign({}, rapConfig, {
        url: req.url,
        projectId: projectId
      }), function () {

      }, function (err, data) { // eslint-disable-line
        if (data) {
          res.json(data);
        }
      });
    }
  }
  mockApp.get('/*', mockToRap);
  mockApp.post('/*', mockToRap);

  const port = options.mockPort || application.mockPort || defaultMockServerPort; // local mock server port
  const uri = `http://${localhost}:${port}`;
  mockApp.listen(port, () => {
    log(`Mock Server runing at: ${uri}`);
    options.callback && options.callback();
  });
};
