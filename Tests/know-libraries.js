const OBSWebSocket = require('obs-websocket-js')
const {globalShortcut, app} = require('electron')
const obs = new OBSWebSocket()

obs.connect({address: '192.168.29.194:4444'}).then(() => {
    console.log('Connected')

    obs.on('SwitchScenes', data => {
        console.log('1')
    })
    obs.on('SwitchScenes', data => {
        console.log('2')
    })
})

app.whenReady().then(() => {
    globalShortcut.register('Ctrl+S', () => {
        console.log('Shortcut 1')
    })

    globalShortcut.register('Ctrl+S', () => {
        console.log('Shortcut 2')
    })
})