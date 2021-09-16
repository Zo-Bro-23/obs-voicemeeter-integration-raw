const express = require('express')
const axios = require('axios')
const OBSWebSocket = require('obs-websocket-js')
const fs = require('fs')
const app = express()
const obs = new OBSWebSocket()
let webhooks
let events
try {
    webhooks = JSON.parse(fs.readFileSync('webhooks.json'))
} catch (error) {
    fs.writeFileSync('webhooks.json', '{"subscribed": []}')
    webhooks = {subscribed: []}
}
if(!Array.isArray(webhooks.subscribed)){
    fs.writeFileSync('webhooks.json', '{"subscribed": []}')
    webhooks = {subscribed: []}
}

try {
    events = JSON.parse(fs.readFileSync('events.json'))
} catch (error) {
    fs.writeFileSync('events.json', '{"subscribed": []}')
    events = {subscribed: []}
}
if(!Array.isArray(events.subscribed)){
    fs.writeFileSync('events.json', '{"subscribed": []}')
    events = {subscribed: []}
}

for(item in events.subscribed){
    obs.on(events.subscribed[item], data => {
        for(microItem in webhooks.subscribed){
            if(webhooks.subscribed[microItem].event == events.subscribed[item]){
                axios.post(webhooks.subscribed[microItem].url, data).catch(err => console.log(err))
            }
        }
    })
}
app.use(express.urlencoded({extended: true}))
app.use(express.json())

obs.connect({address: '192.168.29.194:4444'}).then(() => {
    app.listen(2222)
}).catch(err => console.log(err))

app.get('/', (req, resp) => {
    resp.sendFile('index.html', {root: __dirname})
})

app.get('/close', (req, resp) => {
    resp.send('Closed!')
    process.exit(0)
})

app.post('/sendRequest/:request', (req, resp) => {
    obs.send(req.params.request, req.body).then(data =>{
        resp.send(JSON.stringify(data, null, 4))
    }).catch(err => {
        console.log(err)
        resp.send(JSON.stringify(err, null, 4))
    })
})

app.post('/addWebhook', (req, resp) => {
    if(!req.body.url){
        resp.status(400)
        resp.send('URL not sent.')
        return
    }else if(!req.body.event){
        resp.status(400)
        resp.send('Event not sent.')
        return
    }
    for(item in webhooks.subscribed){
        if(webhooks.subscribed[item].url == req.body.url && webhooks.subscribed[item].event == req.body.event){
            resp.status(400)
            resp.send('Webhook already exists.')
            return
        }
    }
    webhooks.subscribed.push({
        url: req.body.url,
        event: req.body.event
    })
    events.subscribed.push(
        req.body.event
    )
    fs.writeFileSync('webhooks.json', JSON.stringify(webhooks, null, 4))
    fs.writeFileSync('events.json', JSON.stringify(events, null, 4))
    resp.send('Webhook set!')
})

app.post('/deleteWebhook', (req, resp) => {
    if(!req.body.url){
        resp.status(400)
        resp.send('URL not sent.')
        return
    }else if(!req.body.event){
        resp.status(400)
        resp.send('Event not sent.')
        return
    }
    for(item in webhooks.subscribed){
        if(webhooks.subscribed[item].url == req.body.url && webhooks.subscribed[item].event == req.body.event){
            webhooks.subscribed.splice(item, 1)
            fs.writeFileSync('webhooks.json', JSON.stringify(webhooks, null, 4))
            resp.send('Webhook removed!')
            for(microItem in webhooks.subscribed){
                if(webhooks.subscribed[microItem].event == req.body.event){
                    return
                }
            }
            events.subscribed.splice(events.subscribed.indexOf(req.body.event), 1)
            fs.writeFileSync('events.js', JSON.stringify(events, null, 4))
            return
        }
    }
    resp.status(400)
    resp.send('Webhook not found.')
})