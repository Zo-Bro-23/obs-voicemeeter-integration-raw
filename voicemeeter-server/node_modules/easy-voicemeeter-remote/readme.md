# easy-voicemeeter-remote

Voicemeeter-remote is a Node.js wrapper for the official voicemeeterRemote DLL available in the installation directory of [Voicemeeter][voicemeeter], [Voicemeeter banana][voicemeeter-banana], or [Voicemeeter potato][voicemeeter-potato]. More informations about the DLL is available [here](https://forum.vb-audio.com/viewtopic.php?f=8&t=346)

### First install it

```sh
npm install easy-voicemeeter-remote --save
```

### How to use it ?

```js
const voicemeeter = require("easy-voicemeeter-remote");

voicemeeter.init().then(() => {
  voicemeeter.login();
});
```

After the login method is successful you can use all the methods to interact with the instance of Voicemeeter

### Connect and disconnect with the Voicemeeter software

```js
// Connect
voicemeeter.login();
// Disconnect
voicemeeter.logout();
```

### Set parameters like : 'mono', 'solo', 'mute', 'gain', 'gate', 'comp' for each Strip and Bus

```js
// Set the gain of the first Strip to -10db
voicemeeter.setStripGain(0, -10);
// Mute the second Bus
voicemeeter.setBusMute(1, true);
```

### Get All available Parameters form all Strips and Buses. like : 'mono', 'solo', 'mute', 'gain', 'gate', 'comp' ...

```js
console.log("getAllParameter  || ", await voicemeeter.getAllParameter());
```

### Get Multiple Parameters form Strips and Buses.

```js
var data = await voicemeeter.getMultiParameter([
  { type: "Strip", id: 0, getVals: ["mono", "Mute", "solo", "gain"] },
  { type: "Bus", id: 0, getVals: ["Mono", "mute", "gain"] },
]);

console.log("getMultiParameter  || ", data);

/* { strips: [ { type: 'strip', id: 0, mono: 0, mute: 0, solo: 0, gain: -10 } ], 
buses: [{ type: 'bus', id: 0, mono: 0, mute: 0, gain: -18.614171981811523 }]} */
```

### Get Current Level

- Get Level by Strip or Bus ID
- mode = 0= pre fader input levels. 1= post fader input levels. 2= post Mute input levels. 3= output levels.
- index strip or bus id

```js
voicemeeter.getLevelByID(mode, index);

console.log("Level || ", voicemeeter.getLevelByID(3, 6));
```

### Get Midi Data

```js
voicemeeter.getMidi();

console.log("MIDI || ", voicemeeter.getMidi());
```

### Get all input/output devices

```js
// Get all devices from the DLL
// They will be stored into an array in the voicemeeter-remote instance
voicemeeter.updateDeviceList();
// Get input devices
console.log(voicemeeter.inputDevices);
// Get output devices
console.log(voicemeeter.outputDevices);
```

#### Dependencies

[`ffi-napi`][ffi] => Read and execute the VoicemeeterRemote DLL

[`ref-array-napi`][ref-array] => Create array (\*pointer) for `ffi` to return string from the DLL

[`winreg`][winreg] => Read the windows registery to find Voicemeeter installation folder and the DLL

---

#### Base [mikatux/voicemeeter-remote](https://github.com/Mikatux/voicemeeter-remote)

#### [weeryan17/voicemeeter-remote](https://github.com/weeryan17/voicemeeter-remote) forked from [Mikatux/voicemeeter-remote](https://github.com/Mikatux/voicemeeter-remote)

#### [danielhands008/voicemeeter-remote-potato-napi](https://github.com/DanielHands008/voicemeeter-remote-potato-napi) forked from [weeryan17/voicemeeter-remote](https://github.com/weeryan17/voicemeeter-remote)

#### [steffenreimann/easy-voicemeeter-remote](https://github.com/steffenreimann/easy-voicemeeter-remote) forked from [DanielHands008/voicemeeter-remote-potato-napi](https://github.com/DanielHands008/voicemeeter-remote-potato-napi)

# License

MIT

[voicemeeter]: https://www.vb-audio.com/Voicemeeter/index.htm
[voicemeeter-banana]: https://www.vb-audio.com/Voicemeeter/banana.htm
[voicemeeter-potato]: https://www.vb-audio.com/Voicemeeter/potato.htm
[voicemeeter-api]: https://github.com/Mikatux/voicemeeter-api
[ffi]: https://www.npmjs.com/package/ffi-napi
[ref-array]: https://www.npmjs.com/package/ref-array
[winreg]: https://www.npmjs.com/package/winreg
