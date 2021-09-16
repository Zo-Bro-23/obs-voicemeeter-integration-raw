const voicemeeter = require('./index.js');
async function start() {
    try {
        await voicemeeter.init();
        //Login into Voicemeeter
        voicemeeter.login();
        //Update Device List 
        voicemeeter.updateDeviceList();
        // Get Voicemeeter Info  return { name: 'VoiceMeeter Potato', index: 3, version: '3.0.0.8' }
        console.log('VoiceMeeter Info', voicemeeter.getVoicemeeterInfo());




        var test = await voicemeeter.getMultiParameter([
            { type: 'StRip', id: 0, getVals: ['mono', 'Mute', 'solo', 'gain'] },
            { type: 'Bus', id: 0, getVals: ['Mono', 'mute', 'gain'] }
        ])
        console.log(test)

        setInterval(() => {
            if (voicemeeter.isParametersDirty()) {
                Loop()
            }
        }, 10)
    } catch (e) {
        console.log(e)
    }
}



start();


async function Loop(params) {
    console.log('MIDI', ' || ', voicemeeter.getMidi())
    console.log('Level', ' || ', voicemeeter.getLevelByID(3, 6))



    console.log('getAllParameter  || ', await voicemeeter.getAllParameter())
}