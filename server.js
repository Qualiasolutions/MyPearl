const { createServer: createHttpsServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const net = require('net');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Set to false to use HTTP, true to use HTTPS
const useHttps = false;

// Function to check if a port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
};

// Function to find an available port
const findAvailablePort = async (startPort, maxTries = 10) => {
  let port = startPort;
  let tries = 0;
  
  while (tries < maxTries) {
    const inUse = await isPortInUse(port);
    if (!inUse) return port;
    port++;
    tries++;
  }
  
  throw new Error(`Could not find an available port after ${maxTries} attempts`);
};

app.prepare().then(async () => {
  try {
    const port = await findAvailablePort(3000);
    
    if (useHttps) {
      // HTTPS Server (with certificate)
      const httpsOptions = {
        key: fs.readFileSync(path.join(__dirname, 'certificates', 'localhost.key')),
        cert: fs.readFileSync(path.join(__dirname, 'certificates', 'localhost.crt')),
      };
      
      createHttpsServer(httpsOptions, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      }).listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on https://localhost:${port}`);
      });
    } else {
      // HTTP Server (no certificate needed)
      createHttpServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      }).listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
      });
    }
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}); 