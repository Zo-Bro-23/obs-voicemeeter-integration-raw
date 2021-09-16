const voicemeeter = require('easy-voicemeeter-remote')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
let value
app.use(express.urlencoded({extended: true}));
app.use(express.json());

voicemeeter.init().then(() => {
    voicemeeter.login()
    app.listen(1111)
})

app.get('/', (req, resp) => {
    resp.sendFile('index.html', {root: __dirname})
})

app.get('/close', (req, resp) => {
    resp.send('Closed!')
    process.exit(0)
})

app.get('/info', (req, resp) => {
    voicemeeter.getAllParameter().then(r => {
        resp.send(r)
    })
})

app.get('/preFaderLevel/:strip', (req, resp) => {
    resp.send(voicemeeter.getLevelByID(0, req.param.strip))
})

app.get('/postFaderLevel/:strip', (req, resp) => {
    resp.send(voicemeeter.getLevelByID(1, req.param.strip))
})

app.get('/postMuteLevel/:strip', (req, resp) => {
    resp.send(voicemeeter.getLevelByID(2, req.param.strip))
})

app.get('/outputLevel/:bus', (req, resp) => {
    resp.send(voicemeeter.getLevelByID(3, req.param.bus))
})

app.post('/strips/:strip', (req, resp) => {
    for(key in req.body){
        if(!['mute', 'mono', 'solo', 'gain', 'comp', 'gate'].includes(key)){
            throw "That's not a valid setting!"
        }
        voicemeeter["setStrip" + key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()](parseInt(req.params.strip), req.body[key])
    }
    resp.send("Ok!")
})

app.post('/buses/:bus', (req, resp) => {
    for(key in req.body){
        if(!['mute', 'mono', 'gain'].includes(key)){
            throw "That's not a valid setting!"
        }
        voicemeeter["setBus" + key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()](parseInt(req.params.bus), req.body[key])
    }
    resp.send("Ok!")
})

app.post('/stripsRelative/:strip', (req, resp) => {
    for(key in req.body){
        if(!['gain', 'comp', 'gate'].includes(key)){
            throw "That's not a valid setting!"
        }
        voicemeeter.getAllParameter().then(r => {
            value = r.inputs[req.params.strip][key]
            voicemeeter["setStrip" + key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()](parseInt(req.params.strip), (value + req.body[key]))
        })
    }
    resp.send("Ok!")
})

app.post('/busesRelative/:bus', (req, resp) => {
    for(key in req.body){
        if(!['gain'].includes(key)){
            throw "That's not a valid setting!"
        }
        voicemeeter.getAllParameter().then(r => {
            value = r.inputs[req.params.bus][key]
            voicemeeter["setBus" + key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()](parseInt(req.params.bus), (value + req.body[key]))
        })
    }
    resp.send("Ok!")
})