const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('tutor', {
    loadVoc: (id) => ipcRenderer.invoke('loadVoc', id),
    lookup: (word) => ipcRenderer.invoke('lookup', word),
    getAllWords: () => ipcRenderer.invoke('getAllWords'),
    getVersion: () => ipcRenderer.invoke('getVersion'),
    openGithubProfile: () => ipcRenderer.send('openGithubProfile'),
    openGithubProject: () => ipcRenderer.send('openGithubProject'),
})