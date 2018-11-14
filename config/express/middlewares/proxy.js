/**
 * Proxy remote api request
 */
const proxyMiddleware = require('http-proxy-middleware');
const Project = require('../../../lib/project');
const {
  localhost
} = require('../../vars');
const {
  error
} = require('../../../utils/log');

module.exports = function (options) {
  const project = new Project(options.projectPath); // 放置project相关信息
  const server = options.server;
  const {
    application
  } = project;

  const proxyTable = application.proxyTable;
  Object.keys(proxyTable).forEach(function (context) {
    let options = proxyTable[context];
    if (typeof options === 'string') {
      options = {
        target: options
      };
    }
    options.cookieDomainRewrite = localhost; // All domain cooke rewrite to localhost
    options.preserveHeaderKeyCase = true;
    options.debug = true;
    options.secure = false;
    options.onProxyReq = (proxyReq) => {
      // log('Proxy request', proxyReq);
    };
    options.onProxyRes = (proxyRes) => {
      let setCookieHeaders = proxyRes.headers['set-cookie'] || [];
      // cookie path改成 /
      setCookieHeaders = setCookieHeaders.map((cookieItem) => {
        let cookieArr = cookieItem.split(';');
        cookieArr = cookieArr.map((itemFlagment) => {
          itemFlagment = itemFlagment.trim();
          if (itemFlagment.slice(0, 4) === 'Path') {
            itemFlagment = 'Path=/';
          }
          return itemFlagment;
        });
        return cookieArr.join('; ');
      });
      proxyRes.headers['set-cookie'] = setCookieHeaders;
    };
    options.onError = (err) => {
      error('Proxy error', err);
    };
    server.use(proxyMiddleware(options.filter || context, options));
  });
};
