const express = require('express');
const path = require('path');
const fs = require('fs');

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

// Serve static files from the 'build' directory
app.use(express.static(path.join(__dirname, 'build')));

// For any other routes, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  log(`Server running at http://localhost:${PORT}/`);
  log(`Current directory: ${__dirname}`);
  log(`Build directory exists: ${fs.existsSync(path.join(__dirname, 'build'))}`);
});
