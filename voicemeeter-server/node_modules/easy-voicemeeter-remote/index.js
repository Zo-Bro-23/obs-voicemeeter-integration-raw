const ffi = require('ffi-napi');
const Registry = require('winreg');
const ref = require('ref-napi');
const ArrayType = require('ref-array-napi');
const CharArray = ArrayType('char');
const LongArray = ArrayType('long');
const FloatArray = ArrayType('float');
const vmChannels = require('./vmChannels.js');
const ioFuncs = require('./ioFuncs.js');

async function getDLLPath() {
  const regKey = new Registry({
    hive: Registry.HKLM,
    key: '\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VB:Voicemeeter {17359A74-1236-5467}'
  });
  return new Promise(resolve => {
    regKey.values((err, items) => {
      const unistallerPath = items.find(i => i.name === 'UninstallString').value;
      const fileNameIndex = unistallerPath.lastIndexOf('\\');
      resolve(unistallerPath.slice(0, fileNameIndex));
    });
  });
}


const {
  VoicemeeterDefaultConfig,
  VoicemeeterType,
  InterfaceType
} = require('./voicemeeterUtils');

const isEmpty = function (object) {
  for (let key in object) {
    if (object.hasOwnProperty(key))
      return false;
  }
  return true;
};

let libvoicemeeter;

const voicemeeter = {
  isConnected: false,
  isInitialised: false,
  outputDevices: [],
  inputDevices: [],
  channels: vmChannels,
  type: 0,
  version: null,
  voicemeeterConfig: {},
  async init() {
    console.debug(await getDLLPath() + '/VoicemeeterRemote64.dll');
    libvoicemeeter = ffi.Library(await getDLLPath() + '/VoicemeeterRemote64.dll', {
      'VBVMR_Login': ['long', []],
      'VBVMR_Logout': ['long', []],
      'VBVMR_RunVoicemeeter': ['long', ['long']],

      'VBVMR_GetVoicemeeterType': ['long', [LongArray]],
      'VBVMR_GetVoicemeeterVersion': ['long', [LongArray]],

      'VBVMR_IsParametersDirty': ['long', []],
      'VBVMR_GetParameterFloat': ['long', [CharArray, FloatArray]],
      'VBVMR_GetParameterStringA': ['long', [CharArray, CharArray]],

      'VBVMR_SetParameters': ['long', [CharArray]],
      'VBVMR_Output_GetDeviceNumber': ['long', []],
      'VBVMR_Output_GetDeviceDescA': ['long', ['long', LongArray, CharArray, CharArray]],
      'VBVMR_Input_GetDeviceNumber': ['long', []],
      'VBVMR_Input_GetDeviceDescA': ['long', ['long', LongArray, CharArray, CharArray]],
      'VBVMR_GetLevel': ['long', ['long', 'long', 'pointer']],
      'VBVMR_GetMidiMessage': ['long', ['pointer', 'long']],
    });
    this.isInitialised = true;
  },

  runvoicemeeter(voicemeeterType) {
    if (libvoicemeeter.VBVMR_RunVoicemeeter(voicemeeterType) === 0) {
      return;
    }
    throw "running failed";
  },
  isParametersDirty() {
    return libvoicemeeter.VBVMR_IsParametersDirty();
  },
  getParameter(parameterName) {
    if (!this.isConnected) {
      throw "Not connected ";
    }
    var hardwareIdPtr = new Buffer.alloc(parameterName.length + 1);
    hardwareIdPtr.write(parameterName);
    var namePtr = new FloatArray(1);
    libvoicemeeter.VBVMR_GetParameterFloat(hardwareIdPtr, namePtr);
    return namePtr[0]
  },
  _getVoicemeeterType() {
    var typePtr = new LongArray(1);
    if (libvoicemeeter.VBVMR_GetVoicemeeterType(typePtr) !== 0) {
      throw "running failed";
    }
    switch (typePtr[0]) {
      case 1: // Voicemeeter software
        return VoicemeeterType.voicemeeter;
      case 2: // Voicemeeter Banana software
        return VoicemeeterType.voicemeeterBanana;
      case 3:
        return VoicemeeterType.voicemetterPotato;
      default: // unknow software
        return VoicemeeterType.unknow
    }

  },
  _getVoicemeeterVersion() {
    const versionPtr = new LongArray(1);
    if (libvoicemeeter.VBVMR_GetVoicemeeterVersion(versionPtr) !== 0) {
      throw "running failed";
    }
    const v4 = versionPtr[0] % (2 ^ 8);
    const v3 = parseInt((versionPtr[0] - v4) % Math.pow(2, 16) / Math.pow(2, 8));
    const v2 = parseInt(((versionPtr[0] - v3 * 256 - v4) % Math.pow(2, 24)) / Math.pow(2, 16));
    const v1 = parseInt((versionPtr[0] - v2 * 512 - v3 * 256 - v4) / Math.pow(2, 24));
    return `${v1}.${v2}.${v3}.${v4}`;
  },
  login() {
    if (!this.isInitialised) {
      throw "await the initialisation before login";
    }
    if (this.isConnected) {
      return;
    }
    if (libvoicemeeter.VBVMR_Login() === 0) {
      this.isConnected = true;
      this.type = this._getVoicemeeterType();
      this.version = this._getVoicemeeterVersion();
      this.voicemeeterConfig = VoicemeeterDefaultConfig[this._getVoicemeeterType()];
      return;
    }
    this.isConnected = false;
    throw "Connection failed";
  },
  logout() {
    if (!this.isConnected) {
      throw "Not connected";
    }
    if (libvoicemeeter.VBVMR_Logout() === 0) {
      this.isConnected = false;
      return;
    }
    throw "Logout failed";
  },
  updateDeviceList() {
    if (!this.isConnected) {
      throw "Not connected ";
    }
    this.outputDevices = [];
    this.inputDevices = [];
    const outputDeviceNumber = libvoicemeeter.VBVMR_Output_GetDeviceNumber();
    for (let i = 0; i < outputDeviceNumber; i++) {

      var hardwareIdPtr = new CharArray(256);
      var namePtr = new CharArray(256);
      var typePtr = new LongArray(1);

      libvoicemeeter.VBVMR_Output_GetDeviceDescA(i, typePtr, namePtr, hardwareIdPtr);
      this.outputDevices.push({
        name: String.fromCharCode(...namePtr.toArray()).replace(/\u0000+$/g, ''),
        hardwareId: String.fromCharCode(...hardwareIdPtr.toArray()).replace(/\u0000+$/g, ''),
        type: typePtr[0]
      })
    }

    const inputDeviceNumber = libvoicemeeter.VBVMR_Input_GetDeviceNumber();
    for (let i = 0; i < inputDeviceNumber; i++) {

      var hardwareIdPtr = new CharArray(256);
      var namePtr = new CharArray(256);
      var typePtr = new LongArray(1);

      libvoicemeeter.VBVMR_Input_GetDeviceDescA(i, typePtr, namePtr, hardwareIdPtr);
      this.inputDevices.push({
        name: String.fromCharCode(...namePtr.toArray()).replace(/\u0000+$/g, ''),
        hardwareId: String.fromCharCode(...hardwareIdPtr.toArray()).replace(/\u0000+$/g, ''),
        type: typePtr[0]
      })
    }
  },

  _sendRawParaneterScript(scriptString) {
    const script = new Buffer.alloc(scriptString.length + 1);
    script.fill(0);
    script.write(scriptString);
    return libvoicemeeter.VBVMR_SetParameters(script);
  },
  _setParameter(type, name, id, value) {

    if (!this.isConnected) {
      throw "Not connected ";
    }
    if (!this.voicemeeterConfig || isEmpty(this.voicemeeterConfig)) {
      throw "Configuration error  ";
    }
    const interfaceType = type === InterfaceType.strip ? 'Strip' : 'Bus';
    const voicemeeterConfigObject = type === InterfaceType.strip ? 'strips' : 'buses';

    if (this.voicemeeterConfig[voicemeeterConfigObject].findIndex(strip => strip.id === id) === -1) {
      throw `${interfaceType} ${id} not found`;
    }

    return this._sendRawParaneterScript(`${interfaceType}[${id}].${name}=${value};`);
  },
  _setParameters(parameters) {

    if (!this.isConnected) {
      throw "Not connected ";
    }
    if (!this.voicemeeterConfig || isEmpty(this.voicemeeterConfig)) {
      throw "Configuration error  ";
    }

    if (!Array.isArray(parameters)) {
      throw interfaceType + " not found";
    }

    const script = parameters.map(p => {
      const interfaceType = p.type === InterfaceType.strip ? 'Strip' : 'Bus';
      const voicemeeterConfigObject = p.type === InterfaceType.strip ? 'strips' : 'buses';

      if (!this.voicemeeterConfig[voicemeeterConfigObject].find(strip => strip.id === p.id)) {
        throw interfaceType + " not found";
      }
      return `${interfaceType}[${p.id}].${p.name}=${p.value};`;
    }).join('\n');

    return this._sendRawParaneterScript(script);

  },
  getLevel(type, channel) {
    const value = ref.alloc('float');
    handle(libvoicemeeter.VBVMR_GetLevel(type, channel, value));
    return 20 * Math.log10(value.deref()) + 60;
  },
  getMidi() {

    const buffer = new Buffer(1024);
    handle(libvoicemeeter.VBVMR_GetMidiMessage(buffer, 1024));
    const unorg = [...buffer];
    const org = [];
    for (let i = 0; i < unorg.length; i += 3) if (unorg[i]) org.push([unorg[i], unorg[i + 1], unorg[i + 2]]);
    return org;
  },
  getLevelByID(m, index) {
    var mode = m || 0
    index = index || 0
    var out = {}
    var vmType = this._getVoicemeeterType()
    var vmChannelsByType = vmChannels[vmType]
    //console.log(vmType)
    //console.log(vmChannels)
    //console.log(vmChannelsByType)
    if (mode == 3) {
      var outChannels = vmChannelsByType.outputs[index]
      out.l = voicemeeter.getLevel(mode, outChannels.l)
      out.r = voicemeeter.getLevel(mode, outChannels.r)
      out.fc = voicemeeter.getLevel(mode, outChannels.fc)
      out.lfe = voicemeeter.getLevel(mode, outChannels.lfe)
      out.sl = voicemeeter.getLevel(mode, outChannels.sl)
      out.sr = voicemeeter.getLevel(mode, outChannels.sr)
      out.bl = voicemeeter.getLevel(mode, outChannels.bl)
      out.br = voicemeeter.getLevel(mode, outChannels.br)
      return out
    } else if (mode == 0 || 1 || 2) {
      var inChannels = vmChannelsByType.inputs[index]
      var inputs = voicemeeter.voicemeeterConfig.strips
      if (inputs[index].isVirtual) {
        out.l = voicemeeter.getLevel(mode, inChannels.l)
        out.r = voicemeeter.getLevel(mode, inChannels.r)
        out.fc = voicemeeter.getLevel(mode, inChannels.fc)
        out.lfe = voicemeeter.getLevel(mode, inChannels.lfe)
        out.sl = voicemeeter.getLevel(mode, inChannels.sl)
        out.sr = voicemeeter.getLevel(mode, inChannels.sr)
        out.bl = voicemeeter.getLevel(mode, inChannels.bl)
        out.br = voicemeeter.getLevel(mode, inChannels.br)
      } else {
        out.l = voicemeeter.getLevel(mode, inChannels.l)
        out.r = voicemeeter.getLevel(mode, inChannels.r)
      }
      return out
    }
  },
  async getAllParameter() {
    return new Promise((resolve, rejects) => {
      var data = { inputs: [], outputs: [] }

      voicemeeter.voicemeeterConfig.strips.forEach(element => {
        var out = element
        for (var funcName in ioFuncs.strip) {
          var func = ioFuncs.strip[funcName]
          out[func.out] = voicemeeter.getParameter(`Strip[${element.id}].${func.val}`)
        }
        data.inputs.push(out)
      });

      voicemeeter.voicemeeterConfig.buses.forEach(element => {
        var out = element
        for (var funcName in ioFuncs.bus) {
          var func = ioFuncs.bus[funcName]
          out[func.out] = voicemeeter.getParameter(`Bus[${element.id}].${func.val}`)
        }
        data.outputs.push(out)
      });
      resolve(data)
    });
  },
  async getMultiParameter(param) {
    return new Promise((resolve, rejects) => {
      var data = { strips: [], buses: [] }

      param.forEach(paramElement => {
        var out = { type: paramElement.type.toLowerCase(), id: paramElement.id }
        if (paramElement.type.toLowerCase() == 'strip' || 'bus') {
          paramElement.getVals.forEach(element => {
            try {
              var func = ioFuncs[paramElement.type.toLowerCase()][element.toLowerCase()]
              ///console.log(paramElement)
              //console.log(element)
              //console.log(func)
              out[func.out] = voicemeeter.getParameter(`${paramElement.type.toLowerCase()}[${paramElement.id}].${func.val}`)
            } catch (error) {
              console.log(error)
            }
          });
        }

        if (paramElement.type.toLowerCase() == 'strip') {
          data.strips.push(out)
        } else if (paramElement.type.toLowerCase() == 'bus') {
          data.buses.push(out)
        }
      });
      resolve(data)
    });
  },
  getVoicemeeterInfo() {
    var index = this._getVoicemeeterType()
    return { name: vmChannels[index].name, index: index, version: this.version }
  }
}


//Create setter function
const parameterStripNames = ['mono', 'solo', 'mute', 'gain', 'gate', 'comp'];
const parameterBusNames = ['mono', 'mute', 'gain'];

parameterBusNames.forEach(name => {
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

  voicemeeter[`setBus${capitalizedName}`] = function (busNumber, value) {
    if (typeof (value) === 'boolean') {
      voicemeeter._setParameter(InterfaceType.bus, name, busNumber, value ? '1' : '0')
    } else {
      voicemeeter._setParameter(InterfaceType.bus, name, busNumber, value)
    }
  }
});

parameterStripNames.forEach(name => {
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

  voicemeeter[`setStrip${capitalizedName}`] = function (stripNumber, value) {
    if (typeof (value) === 'boolean') {
      voicemeeter._setParameter(InterfaceType.strip, name, stripNumber, value ? '1' : '0')
    } else {
      voicemeeter._setParameter(InterfaceType.strip, name, stripNumber, value)
    }
  }

});

function handle(res, shouldReturn) {
  if (res < 0 && res > -6) throw new Error(res); else if (shouldReturn) return Boolean(res);
}

module.exports = voicemeeter;


