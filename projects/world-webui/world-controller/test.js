// test.js - run in the same node process as the server
const http = require('http');

function test() {
  return new Promise((resolve) => {
    const req = http.request({ hostname: '127.0.0.1', port: 3002, path: '/api/health', method: 'GET' }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log('[TEST] Status:', res.statusCode, 'Body:', data);
        resolve();
      });
    });
    req.on('error', (e) => {
      console.log('[TEST] Error:', e.message);
      resolve();
    });
    req.setTimeout(3000, () => {
      console.log('[TEST] Timeout');
      req.destroy();
      resolve();
    });
    req.end();
  });
}

// Inject test after server starts - wait 2s then test
setTimeout(() => test(), 2000);
