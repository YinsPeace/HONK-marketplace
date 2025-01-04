const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Heroes API proxy
  app.use(
    '/heroes',
    createProxyMiddleware({
      target: 'https://heroes.defikingdoms.com',
      changeOrigin: true,
      pathRewrite: {
        '^/heroes': ''
      },
      onProxyRes: (proxyRes, req, res) => {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
      }
    })
  );
};
