const axios = require('axios')
const open = require('open')

axios.get('http://localhost:4444/dictate').then(res => {
    console.log(res.data)
    axios.post('http://localhost:4444/speak', {message: res.data})
        .then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
}).catch(err => {
    console.log(err)
})