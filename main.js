const serviceUuid = "1bc5ffa0-0200-62ab-e411-f254e005dbd4"; // lowercase hex characters e.g. '00001234-0000-1000-8000-00805f9b34fb'
const name = 'Mooshimeter V.1';
// readable characteristic: 1bc5ffa2-0200-62ab-e411-f254e005dbd4
// writable characteristic: 1bc5ffa1-0200-62ab-e411-f254e005dbd4
var bluetoothDevice;

var letter = 'Waiting...';
var index = 0;

var stars = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  smooth();
  textSize(24);
  textAlign(CENTER);
}

function draw() {
  text(letter, width / 2, height / 2);
}


function mooshiConnect() {
  moosh = new Mooshimeter();
  return moosh.request()
  .then(async function () {
    // you have to do all the setValues, then you get the values in return.
    // we haven't solved the callback on that.
    moosh.setvalue('CH1:MAPPING', 'TEMP');
    moosh.setvalue('CH1:RANGE_I', '255');
    moosh.setvalue('CH1:ANALYSIS', 'MEAN');
    moosh.setvalue('CH1:VALUE', '0');
    moosh.setvalue('CH1:OFFSET', '0');

    moosh.setvalue('CH2:MAPPING', 'VOLTAGE');
    moosh.setvalue('CH2:MAPPING', 'SHARED');
    moosh.setvalue('SHARED', 'AUX_V');
    moosh.setvalue('CH2:ANALYSIS', 'MEAN');

    moosh.setvalue('SAMPLING:RATE', '125');
    moosh.setvalue('SAMPLING:DEPTH', '32');
    moosh.setvalue('SAMPLING:TRIGGER', 'CONTINUOUS');

    moosh.setvalue('NAME', 'tigoe Mooshi');

    // moosh.findnode('CH2:VALUE').callbacks.push(function (node) {
    //   var now = new Date().getTime();
    //   var data = [];
    //   ch2data.push([node.lastupdate, node.value]);
    //   ch2data.forEach(function(e) {
    //     if (now - e[0] < keeptime)
    //     data.push([(e[0] - now) / 1000, e[1]]);
    //   });
    //   console.log(data);
    //
    //   // $.plot('#ch2graph', [data], options);
    //   // $('#ch2value').html(sprintf('%+.8f V', node.value));
    //   // var mv = typeKdegtomV(moosh.findnode('CH1:VALUE').value);
    //   // var t = typeKmVtodegC(mv + node.value * 1000) - 273.15;
    //   // $('#thermvalue').html(sprintf('%+.8f degrees', t));
    // });



    moosh.updatevalue('PCB_VERSION');
    moosh.updatevalue('BAT_V');
    moosh.updatevalue('NAME');



    // console.log('Configuring');
    // console.log('SAMPLING:RATE', '#rate');
    // console.log('SAMPLING:DEPTH', '#depth');
    // console.log('CH1:ANALYSIS', '#channel1analysissel');
    // console.log('CH2:ANALYSIS', '#channel2analysissel');

    /*
    function bindselect(moosh, nodename, id) {
    $(id).change((e) => {
    var val = $(e.target).val();
    moosh.setvalue(nodename, val);
  });

  // Setup callback when we get an update from the meter
  moosh.nodecb(nodename, (node) => { $(id).val(node.value) });

  // Kick off request for current value
  moosh.updatevalue(nodename);
}

*/
// bindselect(moosh, 'SAMPLING:RATE', '#rate');
// bindselect(moosh, 'SAMPLING:DEPTH', '#depth');
// bindselect(moosh, 'CH1:ANALYSIS', '#channel1analysissel');
// bindselect(moosh, 'CH2:ANALYSIS', '#channel2analysissel');
// moosh.nodecb('PCB_VERSION', (node) => { $('#pcbversion').html(node.value) });
// moosh.nodecb('BAT_V', (node) => { $('#batv').html(sprintf("%.2f V", node.value)) });
// moosh.nodecb('NAME', (node) => { $('#name').html(node.value) });
// moosh.updatevalue('PCB_VERSION');
// moosh.updatevalue('BAT_V');
// moosh.updatevalue('NAME');

// Channel 1 mapping can be current, temp or shared
// Channel 2 mapping can be voltage, temp or shared
// Shared mapping can be aux_v, resistance or diode
// Analysis can be mean, rms or buffer
// moosh.setvalue('CH1:MAPPING', 'TEMP');
// moosh.setvalue('CH1:ANALYSIS', 'MEAN');
// //moosh.setvalue('CH2:MAPPING', 'VOLTAGE');
// moosh.setvalue('CH2:MAPPING', 'SHARED');
// moosh.setvalue('SHARED', 'AUX_V');
// moosh.setvalue('CH2:ANALYSIS', 'MEAN');
//
// moosh.setvalue('SAMPLING:RATE', '125');
// moosh.setvalue('SAMPLING:DEPTH', '32');
// moosh.setvalue('SAMPLING:TRIGGER', 'CONTINUOUS');
//       //moosh.setvalue('NAME', 'Daniel\'s Mooshi');

//   setStatus('Running');
//   $(".graphcontainer").resizable({minWidth: 100, minHeight: 50});
//   $(".graphcontainer").resizable({minWidth: 100, minHeight: 50});
//   var ch1data = [];
//   moosh.findnode('CH1:VALUE').callbacks.push(function (node) {
// var now = new Date().getTime();
// var degc = node.value - 273.15;
// var data = [];
// ch1data.push([node.lastupdate, degc]);
// ch1data.forEach(function(e) {
//     if (now - e[0] < keeptime)
// 	data.push([(e[0] - now) / 1000, e[1]]);
// });
// $.plot('#ch1graph', [data], options);
// $('#ch1value').html(sprintf('+%.2f &deg;C', degc));
//   });
//   var ch2data = [];
//   moosh.findnode('CH2:VALUE').callbacks.push(function (node) {
// var now = new Date().getTime();
// var data = [];
// ch2data.push([node.lastupdate, node.value]);
// ch2data.forEach(function(e) {
//     if (now - e[0] < keeptime)
// 	   data.push([(e[0] - now) / 1000, e[1]]);
// });
// $.plot('#ch2graph', [data], options);
//       $('#ch2value').html(sprintf('%+.8f V', node.value));
//       var mv = typeKdegtomV(moosh.findnode('CH1:VALUE').value);
//       var t = typeKmVtodegC(mv + node.value * 1000) - 273.15;
//       $('#thermvalue').html(sprintf('%+.8f degrees', t));
//   });

// this just keeps the meter paired:
while (1) {
  // // Tell the device we're still here
//  await moosh.updatevalue('PCB_VERSION');
  await new Promise(function(resolve) {
    // console.log(new Date())
    setTimeout(resolve, 1000);

  })
}
});
}
