
const { contextBridge, ipcRenderer } = require('electron')
const { shell } = require('electron')

contextBridge.exposeInMainWorld('shell', {
    openExternal: (url) => shell.openExternal(url)
})

contextBridge.exposeInMainWorld( 'ipcRenderer', {
    send: ( channel, data ) => ipcRenderer.send( channel, data ),
    on: ( channel, callable) => ipcRenderer.on( channel, (event, data) => callable( event, data ) ),
    sendSync: ( channel, data ) => ipcRenderer.sendSync( channel, data ),
} )
