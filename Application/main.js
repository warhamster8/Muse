const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    title: "Muse - Desktop",
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, 'icon.png')
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Load from the local web-dist folder which is now bundled with the app
    const indexPath = path.join(__dirname, 'web-dist', 'index.html');
    mainWindow.loadFile(indexPath).catch(err => {
      console.error("Failed to load index.html at:", indexPath);
      console.error("Error details:", err);
    });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
