const axios = require('axios')
const open = require('open')

axios.get('http://localhost:23708/voiceControl/dictate').then(res => {
    console.log(res.data)
    axios.post('http://localhost:23708/voiceControl/speak', {message: res.data})
        .then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
}).catch(err => {
    console.log(err)
})