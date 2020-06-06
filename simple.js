
function Mooshimeter() {
    this.serviceUuid = "1bc5ffa0-0200-62ab-e411-f254e005dbd4";
    this.serinCharacteristicUuid = "1bc5ffa1-0200-62ab-e411-f254e005dbd4"; // write
    this.seroutCharacteristicUuid = "1bc5ffa2-0200-62ab-e411-f254e005dbd4"; // notify
    this.seroutCharacteristic = null;
    this.serinCharacteristic = null;
    this.rxseqn = -1;
    this.txseqn = 0;
    this.buf = null;
    this.tree = null;
    this.crc = null;
    this.state = 0;
    this.got = 0;
    this.pending = null;
    this.device = null;
    this.connected = false;
    this.treecb = null;
  //  this.sendq = d3.queue(1);
};


var moosh = new Uint8Array();

function connect() {
  let options = {
    filters: [{
      services: [serviceUuid]//,
//      name: name
    }]}

  console.log('Requesting Bluetooth Device...');

  navigator.bluetooth.requestDevice(options)
  .then(device => {
    bluetoothDevice = device; // save a copy
    console.log('Got device', device.name);
    return device.gatt.connect();
  })
  .then(server => {

      console.log('Getting Service...');
      return server.getPrimaryService(serviceUuid);



    })
    .then(service => {
      console.log('Getting Characteristics...');
      // Get all characteristics.
      return service.getCharacteristics();
    })
    .then(characteristics => {
      console.log('Got Characteristics');
      // TODO: instantiate the mooshimeter here
      console.log(characteristics);

      //   // Tell the meter to start reading, pass back char to read
        setMeterSettings(moosh, function(meterSample) {
          // Start reading that char
          console.log(meterSample);
          startReadingMeter(meterSample);
        });
      //characteristicPattern = characteristics[0];
      //characteristics[0].addEventListener('characteristicvaluechanged', handleData);

    })
    .catch(error => {
      console.log('Argh! ' + error);
    });
  }

function startNotify() {
  console.log('starting notifications');
  characteristicPattern.startNotifications();
}

function handleData(event) {
  value = event.target.value.getUint8(0);
  console.log('> Got Pattern data: ' + value);
  if (value !== 48) {
    letter = String.fromCharCode(value);
    console.log('> Converted data to letter: : ' + letter);
  } else {
    letter = 'Waiting...';
    console.log('> Could not recognize the gesture...');
  }
}

function disconnect() {
  if (bluetoothDevice && bluetoothDevice.gatt) {
    bluetoothDevice.gatt.disconnect();
    console.log('Discoonected');
  }
}
///////////////////////////////////////////////////////////////



function startReadingMeter(meterSample) {

    meterSample.on('notification', function(value) {
      var voltage = 0;
      for (var i = 0; i < 3; i++) {
        voltage += value[3+i] << (i*8);
      }
      voltage = (0x1000000 - voltage)  * (1.51292917e-04);

      console.log("Voltage", voltage);
    });

    meterSample.startNotifications();
}

function setMeterSettings(mooshimeter, callback) {
  if (mooshimeter) {
    // Find the characteristic with meter settings
    mooshimeter.discoverCharacteristics(['ffa2', 'ffa6'], function(err, characteristics) {
      var meterSample = characteristics[0];
      var meterSettings = characteristics[1];

      // Update meter settings struct to start reading...
      meterSettings.write(new Buffer([3, 2, 0, 0, 0, 0, 0, 0, 23]), function(err, valueWritten) {
        callback && callback(meterSample);
      });
    });
  }
}

function connectToMoosh(callback) {
  bluetooth.filterDiscover(mooshFilter, function(err, moosh) {
    bluetooth.stopScanning(function(err) {
      moosh.connect(function(err) {
        callback && callback(moosh);
      });
    });
  });

  bluetooth.startScanning();
}

function mooshFilter(peripheral, callback) {
  for (var i = 0; i < peripheral.advertisingData.length; i++) {
    var packet = peripheral.advertisingData[i];

    if (packet.type = 'Incomplete List of 16-bit Service Class UUIDs'
        && packet.data[0] == '0xffa0') {
      return callback(true);
    }
  }
  return  callback(false);
}
