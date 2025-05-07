const express = require('express');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { exec } = require('child_process');

const app = express();
const PORT = 3456;

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: ${message}`);
}

// Middleware to log all requests
app.use((req, res, next) => {
  log(`Request for: ${req.url}`);
  next();
});

// DFK API proxy middleware
app.use(
  '/dfk-api',
  createProxyMiddleware({
    target: 'https://api.defikingdoms.com',
    changeOrigin: true,
    pathRewrite: {
      '^/dfk-api': '',
    },
    onProxyRes: function (proxyRes, req, res) {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
    },
    onError: function(err, req, res) {
      log(`Proxy error: ${err.message}`);
      res.status(500).send('Proxy Error');
    },
  })
);

// Serve static files from the 'build' directory
app.use(express.static(path.join(__dirname, 'build')));

// For any other routes, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}/`;
  log(`Server running at ${url}`);
  log(`Current directory: ${__dirname}`);
  log(`Build directory exists: ${fs.existsSync(path.join(__dirname, 'build'))}`);
  
  // Open browser automatically
  log('Opening browser...');
  // Use different commands based on platform
  const cmd = process.platform === 'win32' ? `start ${url}` : 
              process.platform === 'darwin' ? `open ${url}` : 
              `xdg-open ${url}`;
  
  exec(cmd, (err) => {
    if (err) {
      log(`Failed to open browser: ${err.message}`);
    }
  });
});
