//
// Bluetooth example (webbluetooth @ Chrome / Mac OS, Linux, Android, Windows)
//
let device;
let server;
let service;
let characteristic;
var rxResponse = false;
const hitoServiceUuid   = '5cc44b16-070a-11ed-b939-0242ac120002';
const hitoTxUuid        = '5cc44b17-070a-11ed-b939-0242ac120002';

async function _sendRequestBluetooth(payload) {
  //log(`Sending via Bluetooth: [${payload}]`);
  // wait for bluetooth connection
  await _connectBluetooth();

  // encode payload
  let payloadData = new Uint8Array(new TextEncoder().encode(payload));
  let payloadSize = payloadData.length;

  // send first packet with payload size little endian
  let upload_info = new Uint8Array(5);
  upload_info[0]  = 0x69; // 'i' - CMD_UPLOAD_INFO
  upload_info[4]  = (payloadSize >> 24) & 0xff; upload_info[3]  = (payloadSize >> 16) & 0xff;
  upload_info[2]  = (payloadSize >> 8)  & 0xff; upload_info[1]  = (payloadSize >> 0)  & 0xff;
  //log(`Sending message size: ${payloadSize}`);
  await characteristic.writeValue(upload_info);
  await _waitBluetoothResponse('ok', 1000);

  // send data packets
  let packetSize = 505;
  if (rxResponse == 'ok') {
    for(let i = 0, rest = payloadSize; i < payloadSize; i += packetSize, rest -= packetSize) {

      var dataChunk = new Uint8Array(1 + (rest > packetSize ? packetSize : rest));
      dataChunk[0] = 0x64; // 'd' - HITO_CMD_DATA
      dataChunk.set(payloadData.slice(i, i + dataChunk.length - 1), 1);

      rxResponse = false;
      await characteristic.writeValue(dataChunk);
      await _waitBluetoothResponse('ok', rest > packetSize ? 60000 : 1000);
    }
  }

  return true;
}

async function _connectBluetooth() {

  let isBluetoothAvailable = false;
  try {
    isBluetoothAvailable = await navigator.bluetooth.getAvailability();
    if (!isBluetoothAvailable) {
      throw('Bluetooth is not available');
    }
  } catch(error) {
    isBluetoothAvailable = false;
    throw('Bluetooth is not supported by this browser');
  }

  //log('Requesting Bluetooth device...');
  device = await navigator.bluetooth.requestDevice({
      filters: [{namePrefix: 'hito'}],
      optionalServices: [hitoServiceUuid],
  });

  //log(`Connecting to GATT server for device ${device.name}...`);
  server = await device.gatt.connect();

  //log('Connected successfully!');

  service = await server.getPrimaryService(hitoServiceUuid);
  characteristic = await service.getCharacteristic(hitoTxUuid);
  await characteristic.startNotifications().then(_ => {
    characteristic.addEventListener('characteristicvaluechanged', _handleBluetoothResponse);
  });
}

function _handleBluetoothResponse(event) {
  let value = event.target.value;
  let a = [];
  for (let i = 0; i < value.byteLength; i++) {
    a.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
  }
  rxResponse = String.fromCharCode.apply(String, a);
}

async function _delayMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function _waitBluetoothResponse(response, elapsed = 60000) {
  let timeElapsed = elapsed;
  while(!rxResponse) {
    await _delayMs(1);
    timeElapsed -= 5;
    if (timeElapsed < 0) {
      throw(`No answer from device in ${elapsed} seconds`);
    }
  }
  if (response && rxResponse != response) {
    throw('wrong bluetooth response: ' + rxResponse);
  }
}
