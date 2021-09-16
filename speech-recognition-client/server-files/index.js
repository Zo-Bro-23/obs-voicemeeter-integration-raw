function everything(){
  document.getElementById('button').style.display = 'none'
  document.getElementById('img').style.display = 'block'

  navigator.permissions.query({ name: 'microphone' })
    .then(permissionStatus => {
        if(permissionStatus.state == 'denied'){
            document.getElementById('p').innerHTML = 'Permission is denied.'
            document.getElementById('img').style.display = 'none'
        }
        permissionStatus.onchange = () => window.location.reload()

      })

  function speak(text){
    return new Promise((resolve, reject) => {
      try{
        const synth = window.speechSynthesis
        let utterThis = new SpeechSynthesisUtterance(text)
        utterThis.voice = synth.getVoices()[20]
        utterThis.onend = () => {
          resolve()
        }
        synth.speak(utterThis)
      }catch(err){
        reject(err)
      }
    })
  }

  function dictate(){
    return new Promise((resolve, reject) => {
      try{
        window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.start()
        recognition.onresult = event => {
            resolve(event.results[0][0].transcript)
        }
      }catch(err){
        reject(err)
      }
    })
  }

  function dictateFunc(){
    axios.get('http://localhost:37492/shouldDictate').then(res => {
      temp = res.data
      if(temp == 'Yes!'){
        dictate().then(res => {
          axios.post('http://localhost:37492/doneDictating', {message: res})
          console.log(res)
          dictateFunc()
        }).catch(err => {
          console.log(err)
          dictateFunc()
        })
      }else{
        dictateFunc()
      }
    })
  }

  dictateFunc()

  function speakFunc(){
    axios.get('http://localhost:37492/shouldSpeak').then(res => {
      temp = res.data
      if(temp.shouldSpeak == true){
        speak(temp.message).then(() => {
          console.log('Done')
          axios.post('http://localhost:37492/doneSpeaking')
          speakFunc()
        }).catch(err => {
          console.log(err)
          speakFunc()
        })
      }else{
        speakFunc()
      }
    })
  }

  speakFunc()

  window.onbeforeunload = () => {
    return "Are you sure?"
  }
}

const axios = require('axios')
let temp
document.getElementById('button').onclick = everything

window.onload = () => {
  axios.post('http://localhost:37492/open')
}

window.onunload = () => {
  axios.post('http://localhost:37492/close')
}