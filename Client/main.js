
const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const path = require('path')
const http = require('http')
const fs = require('fs')
const tokenProtocol = "final-project"
let mainWindow

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} 
else {
  const ipcGenerator = require('./ipc.js')
  ipcGenerator(ipcMain)

  app.on('second-instance', (event, commandLine, workingDirectory) => {
    
    var authToken = commandLine[3].slice(tokenProtocol.length + 3, -1)

    console.log("Generated Google SSO auth token: " + "\n" + authToken)
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
    }
  })

  function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
          preload: path.join(app.getAppPath(), 'preload.js')
      }
    })

    // and load the index.html of the app.
    mainWindow.loadFile('./pages/index.html')
  }

  // This makes the protocol tokenProtocol://<customParameters> open with this process so we can redirect back 
  // from our web browser when we use Google SSO
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(tokenProtocol, process.execPath, [path.resolve(process.argv[1])])
    }
  } 
  else {
    app.setAsDefaultProtocolClient(tokenProtocol, process.execPath, [path.resolve(process.argv[1])])
  }

  // Create a local webserver we can use for Google SSO
  var googlePage = fs.readFileSync('./pages/google.html');
  http.createServer(function (req, res) {
    res.writeHead(200, 
      {
        'Set-Cookie': 'SameSite=None;Secure',
        'Content-Type': 'text/html'
      });
    res.end(googlePage);
  }).listen(8887);

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    
    createWindow()

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
  })

}

