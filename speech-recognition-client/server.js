const express = require('express')
const timeout = require('connect-timeout')
const fs = require('fs')
const openLib = require('open')
const { report } = require('process')
const cors = require('cors')
const secondServer = require('./server-files/second-server')
const app = express()
const secondApp = express()
let dictate = false
let speak = false
let open = false
let tempFunc
let tempSpeakFunc

secondServer.listen(37492)
secondServer.use(express.urlencoded({extended: true}))
secondServer.use(express.json())
secondServer.use(cors())
app.listen(4444)
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(express.static(__dirname + '/server-files'))
app.use(cors())
app.use((req, resp, next) => {
    req.setTimeout(2147483647)
    next()
})

app.get('/dictate', (req, resp) => {
    if(tempFunc == undefined){
        dictate = true
        if(!open){
            openLib('http://localhost:4444')
        }
        tempFunc = (message) => resp.send(message)
    }else{
        resp.status(400)
        resp.send('Gimme one job at a time, bro!')
    }
})

app.post('/speak', (req, resp) => {
    if(tempSpeakFunc == undefined){
        if(!req.body.message){
            resp.status(400)
            resp.send('Message not sent.')
            return
        }
        speak = req.body.message
        if(!open){
            openLib('http://localhost:4444')
        }
        tempSpeakFunc = (message) => resp.send(message)
    }else{
        resp.status(400)
        resp.send('My mouth\'s full enough as is!')
    }
})

secondServer.get('/shouldDictate', (req, resp) => {
    if(dictate){
        resp.send('Yes!')
        dictate = false
    }else{
        resp.send('No, not yet!')
    }
})

secondServer.get('/shouldSpeak', (req, resp) => {
    if(speak){
        resp.send({shouldSpeak: true, message: speak})
        speak = false
    }else{
        resp.send({shouldSpeak: false})
    }
})

secondServer.post('/doneDictating', (req, resp) => {
    if(!req.body.message){
        resp.send('Oops! You forgot the message!')
    }
    tempFunc(req.body.message)
    tempFunc = undefined
    resp.send('Cool! Managed everything!')
})

secondServer.post('/doneSpeaking', (req, resp) => {
    tempSpeakFunc('Done speaking!')
    tempSpeakFunc = undefined
    resp.send('Cool! Managed everything!')
})

secondServer.post('/open', (req, resp) => {
    open = true
    resp.send('Hey, thanks for letting me know!')
})

secondServer.post('/close', (req, resp) => {
    open = false
    resp.send('Again, thanks for letting me know!')
})