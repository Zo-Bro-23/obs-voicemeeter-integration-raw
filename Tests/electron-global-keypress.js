const express = require('express')
const axios = require('axios')
const app = express()
app.listen(5210)

app.use(express.urlencoded({extended: true}))
app.use(express.json())

axios.post('http://localhost:3333/addWebhook', {key: 'Ctrl+S', url: 'http://localhost:5210/keyPress'}).catch(err => {
    console.log(err)
}).then(r => {
    console.log(r)
})

axios.post('http://localhost:3333/addWebhook', {key: 'Ctrl+Z', url: 'http://localhost:5210/keyPress'}).catch(err => {
    console.log(err)
}).then(r => {
    console.log(r)
})

axios.post('http://localhost:3333/addWebhook', {key: 'Ctrl+S', url: 'http://localhost:5210/2'}).catch(err => {
    console.log(err)
}).then(r => {
    console.log(r)
})

axios.post('http://localhost:3333/addWebhook', {key: 'Ctrl+Z', url: 'http://localhost:5210/2'}).catch(err => {
    console.log(err)
}).then(r => {
    console.log(r)
})

app.post('/keyPress', (req, resp) => {
    console.log(req.body)
})

app.post('/2', (req, resp) => {
    console.log(req.body)
})

setTimeout(() => {
    axios.post('http://localhost:3333/deleteWebhook', {key: 'Ctrl+S', url: 'http://localhost:5210/keyPress'}).catch(err => {
        console.log(err)
    }).then(r => {
        console.log(r)
    })

    axios.post('http://localhost:3333/deleteWebhook', {key: 'Ctrl+Z', url: 'http://localhost:5210/keyPress'}).catch(err => {
        console.log(err)
    }).then(r => {
        console.log(r)
    })

    axios.post('http://localhost:3333/deleteWebhook', {key: 'Ctrl+S', url: 'http://localhost:5210/2'}).catch(err => {
        console.log(err)
    }).then(r => {
        console.log(r)
    })

    axios.post('http://localhost:3333/deleteWebhook', {key: 'Ctrl+Z', url: 'http://localhost:5210/2'}).catch(err => {
        console.log(err)
    }).then(r => {
        console.log(r)
    })
}, 120000)