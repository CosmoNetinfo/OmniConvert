const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'public/logo.png'),
    backgroundColor: '#020205',
    autoHideMenuBar: true,
    resizable: false,
    maximizable: false
  });

  const checkServer = () => {
    http.get('http://localhost:3000', (res) => {
      // Server is ready, load URL
      if (mainWindow) mainWindow.loadURL('http://localhost:3000');
    }).on('error', (err) => {
      // Server not ready yet, retry
      setTimeout(checkServer, 500);
    });
  };

  checkServer();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startServer() {
  const serverPath = path.join(__dirname, 'server/index.js');
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, ELECTRON_RUN: 'true' }
  });
}

app.on('ready', () => {
  startServer();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    if (serverProcess) serverProcess.kill();
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
