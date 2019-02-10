const {app, BrowserWindow, ipcMain, shell, electron} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({width: 600, height: 300, resizable: true})

    // and load the index.html of the app.
    win.loadURL(`file://${__dirname}/index.html`)

    // remove menu
    win.setMenu(null)

    // Open the DevTools.
    //win.webContents.openDevTools()

    // Stop it from navigating away
    let handleRedirect = (e, url) => {
        if (url !== win.webContents.getURL()) {
            e.preventDefault()
            shell.openExternal(url)
        }
    }
    win.webContents.on('will-navigate', handleRedirect)
    win.webContents.on('new-window', handleRedirect)

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const fs = require('fs')
const apiKey = 'YOUR API KEY HERE'
let tinify = require("tinify")
const filesize = require('filesize')

validateApiKeySendCount = (event, key) => {
    tinify.key = key

    tinify.validate((err) => {
        if (err) {
            event.sender.send('async-count-update', {
                success: false,
                data: err
            })
            return
        }

        event.sender.send('async-count-update', {
            success: true,
            data: tinify.compressionCount
        })
    })
}

getFilesize = (filepath) => {
    let stats = fs.statSync(filepath)
    return stats.size
}

ipcMain.on('async-compress-file', (event, arg) => {
    tinify.fromFile(arg.path).toFile(arg.pathTo, (err) => {
        if (err) {
            arg.status = 'Error'
            event.sender.send('async-compress-file-reply', {
                success: false,
                data: arg
            })
            return
        }

        arg.status = 'Compressed'
        arg.sizeCompressed = getFilesize(arg.pathTo)
        arg.readableSizeCompressed = filesize(getFilesize(arg.pathTo))
        event.sender.send('async-compress-file-reply', {
            success: true,
            data: arg
        })
        event.sender.send('async-count-update', {
            success: true,
            data: tinify.compressionCount
        })
    })
})

ipcMain.on('async-load-settings', (event, arg) => {
    validateApiKeySendCount(event, apiKey)
})

ipcMain.on('resize-window', (event, arg) => {
    if (win.getSize()[1] <= 900) { win.setSize(600, win.getSize()[1] + 30) }
    return 
})
