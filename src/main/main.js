const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const { shell } = require('electron')

let voc = []

function loadVoc(id)
{
    if (id === 0)
    {
        voc = require('../../static/voc/words.json')
        return true
    }
    else if (id === 1)
    {
        voc = require('../../static/voc/words_advanced.json')
        return true
    }
    return false
}

function lookup(w)
{
    for (let i = 0; i < voc.length; ++i)
    {
        if (voc[i].word == w)
            return voc[i]
    }
    return null
}

function getAllWords()
{
    var ret = new Set()
    voc.forEach((word) =>
    {
        ret.add(word.word)
    })
    return ret
}

const createWindow = () =>
{
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
    })
    // TODO
    //win.setMenu(null)
    win.loadFile(path.join(__dirname, '..', '..', 'static', 'html', 'index.html'))
}

app.whenReady().then(() =>
{
    ipcMain.handle('loadVoc', (event, message) => { return loadVoc(message) })
    ipcMain.handle('lookup', (event, message) => { return lookup(message) })
    ipcMain.handle('getAllWords', (event) => { return getAllWords() })
    ipcMain.handle('getVersion', (event) => { return app.getVersion() })
    ipcMain.on('openGithubProfile', (event, path) =>
    {
        shell.openExternal("https://github.com/caozhanhao")
    })
    ipcMain.on('openGithubProject', (event, path) =>
    {
        shell.openExternal("https://github.com/caozhanhao/tutor")
    })

    createWindow()

    app.on('activate', () =>
    {
        if (BrowserWindow.getAllWindows().length === 0)
        {
            createWindow()
        }
    })
})

app.on('window-all-closed', () =>
{
    if (process.platform !== 'darwin')
    {
        app.quit()
    }
})