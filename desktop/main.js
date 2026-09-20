const { app, BrowserWindow } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const isDev = process.argv.includes('--dev');
const WEB_PORT = process.env.ALN_WEB_PORT || '8081';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.css': 'text/css; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function resolveDistPath() {
  const candidates = [
    path.join(__dirname, '../dist'),
    path.join(process.resourcesPath, 'app.asar', 'dist'),
    path.join(process.resourcesPath, 'app', 'dist'),
    path.join(app.getAppPath(), 'dist'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }

  return candidates[0];
}

function writeLog(message) {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(path.join(logDir, 'desktop.log'), line, 'utf8');
  } catch {
    // ignore logging failures
  }
}

function startStaticServer(root) {
  const rootNorm = path.normalize(root);

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url, 'http://127.0.0.1');
        let reqPath = decodeURIComponent(url.pathname);
        if (reqPath.startsWith('/')) reqPath = reqPath.slice(1);
        if (!reqPath) reqPath = 'index.html';

        let filePath = path.normalize(path.join(rootNorm, reqPath));
        const insideRoot = filePath === rootNorm || filePath.startsWith(rootNorm + path.sep);

        if (!insideRoot) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        const serveFile = (targetPath) => {
          fs.readFile(targetPath, (err, data) => {
            if (err) {
              if (!path.extname(reqPath)) {
                const indexPath = path.join(rootNorm, 'index.html');
                return fs.readFile(indexPath, (indexErr, indexData) => {
                  if (indexErr) {
                    res.writeHead(404);
                    res.end('Not found: ' + reqPath);
                    return;
                  }
                  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                  res.end(indexData);
                });
              }
              res.writeHead(404);
              res.end('Not found: ' + reqPath);
              return;
            }
            res.writeHead(200, { 'Content-Type': contentType(targetPath) });
            res.end(data);
          });
        };

        fs.stat(filePath, (statErr, stats) => {
          if (statErr || !stats.isFile()) {
            if (!path.extname(reqPath)) {
              filePath = path.join(rootNorm, 'index.html');
            }
          }
          serveFile(filePath);
        });
      } catch (e) {
        writeLog('Static server error: ' + e);
        res.writeHead(500);
        res.end(String(e));
      }
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

let staticServer = null;

function showErrorPage(win, message) {
  const html = `<body style="background:#0A0A12;color:#fff;font-family:sans-serif;padding:40px">
    <h2>Meu Controle — erro ao carregar</h2>
    <p>${message}</p>
    <p>Execute <b>COMPILAR-PC.bat</b> novamente.</p>
  </body>`;
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  win.show();
}

async function createWindow() {
  const distPath = resolveDistPath();
  writeLog(`Starting Meu Controle. packaged=${app.isPackaged} dist=${distPath}`);

  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'Meu Controle',
    backgroundColor: '#14141F',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, '../assets/aln-pc.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2) {
      writeLog(`Console[${level}] ${message} (${sourceId}:${line})`);
    }
  });

  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    writeLog(`did-fail-load ${code} ${desc} ${url}`);
    showErrorPage(win, `${desc} (${code})`);
  });

  win.webContents.on('render-process-gone', (_e, details) => {
    writeLog(`render-process-gone ${details.reason}`);
    showErrorPage(win, 'O app fechou inesperadamente. Abra novamente.');
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    win.loadURL(`http://localhost:${WEB_PORT}`);
    if (process.env.ALN_SILENT !== '1') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    const indexPath = path.join(distPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      writeLog('dist/index.html not found');
      showErrorPage(win, 'Pasta dist/ nao encontrada. Rode COMPILAR-PC.bat.');
      return;
    }

    try {
      const { server, port } = await startStaticServer(distPath);
      staticServer = server;
      writeLog(`Static server on http://127.0.0.1:${port}/`);
      await win.loadURL(`http://127.0.0.1:${port}/`);
    } catch (err) {
      writeLog('Failed to start static server: ' + err);
      showErrorPage(win, String(err));
    }
  }

  win.setTitle('Meu Controle');
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (staticServer) staticServer.close();
  if (process.platform !== 'darwin') app.quit();
});
