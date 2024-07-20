const { app, BrowserWindow, ipcMain } = require('electron/main')
const  path  = require('node:path')
const  {shell }= require('electron')
const  isDev  = import('electron-is-dev')

const voc = require('./words.json')

function bookname2id(str)
{
    switch (str)
    {
        case '七年级上册': return 71
        case '七年级下册': return 72
        case '八年级上册': return 81
        case '八年级下册': return 82
        case '九年级全一册': return 91
    }
}

function unitname2id(str)
{
    if (str.charAt(0) == 'S')
    {
        // Starter Unit xxx
        return -parseInt(str.slice(13))
    }
    else
    {
        // Unit xxx
        return parseInt(str.slice(5))
    }
}

function lookup(w)
{
    var ret = new Array()
    voc["books"].forEach((book) =>
    {
        book["units"].forEach((unit) =>
        {
            unit["words"].forEach((word) =>
            {
                if (word.word == w)
                {
                    word.book = bookname2id(book.name)
                    word.unit = unitname2id(unit.name)
                    ret.push(word)
                }
            })
        })
    })
    return ret
}

function getAllWords()
{
    var ret = new Set()
    voc["books"].forEach((book) =>
    {
        book["units"].forEach((unit) =>
        {
            unit["words"].forEach((word) =>
            {
                ret.add(word.word)
            })
        })
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
    if (!isDev)
        win.setMenu(null)
    win.loadFile(path.join(__dirname, '..', 'static', 'index.html'))
}

app.whenReady().then(() =>
{
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