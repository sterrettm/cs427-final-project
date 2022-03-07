
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld( 'ipcRenderer', {
    send: ( channel, data ) => ipcRenderer.send( channel, data ),
    on: ( channel, callable) => ipcRenderer.on( channel, (event, data) => callable( event, data ) ),
    sendSync: ( channel, data ) => ipcRenderer.sendSync( channel, data ),
    
} )
