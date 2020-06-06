var moosh = null;
var keeptime = 60 * 1000;
var options = {
  lines: {
    show: true
  },
  points: {
    show: true
  },
  xaxis: {
    min: -(keeptime / 1000),
    max: 0,
  },
  yaxis: {
    tickFormatter: function (n, o) {
      return sprintf("%+.2f", n);
    }
  },
};

function mooshidisconnect() {
  setStatus('Disconnected');
  try {
    if (moosh != null)
    moosh.disconnect();
  } catch (e) {
    console.log('Error disconnecting: ' + e);
  }
  // Reset widgets
  mooshisetup(false);
}

function mooshisetup(resetgraphs) {
  clearselects();
  if (resetgraphs) {
    $.plot('#ch1graph', [[]], options);
    $.plot('#ch2graph', [[]], options);
  }
  $('#pcbversion').html('-');
  $('#batv').html('-');
  $('#name').html('-');
}

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

function fillselect(nodename, id) {
  var n = moosh.findnode(nodename);
  clearselect(id);
  for (var i = 0; i < n.children.length; i++) {
    $(id).append(new Option(n.children[i].name, n.children[i].name));
  }
}

function clearselect(id) {
  $(id).empty();
  $(id).append('<option disabled selected value style="display:none">--</option>');
}

function clearselects() {
  clearselect('#rate');
  clearselect('#depth');
  clearselect('#channel1rangesel');
  clearselect('#channel2rangesel');
}

async function mooshimain() {
  await mooshiinner().catch((e) => {
    console.log('error ' + e);
    mooshidisconnect();
  });
}

function mooshiinner() {
  moosh = new Mooshimeter();
  setStatus('Requesting');
  return moosh.request()
  .then(async function () {
    setStatus('Configuring');
    fillselect('SAMPLING:RATE', '#rate');
    fillselect('SAMPLING:DEPTH', '#depth');
    fillselect('CH1:ANALYSIS', '#channel1analysissel');
    fillselect('CH2:ANALYSIS', '#channel2analysissel');
    bindselect(moosh, 'SAMPLING:RATE', '#rate');
    bindselect(moosh, 'SAMPLING:DEPTH', '#depth');
    bindselect(moosh, 'CH1:ANALYSIS', '#channel1analysissel');
    bindselect(moosh, 'CH2:ANALYSIS', '#channel2analysissel');
    moosh.nodecb('PCB_VERSION', (node) => { $('#pcbversion').html(node.value) });
    moosh.nodecb('BAT_V', (node) => { $('#batv').html(sprintf("%.2f V", node.value)) });
    moosh.nodecb('NAME', (node) => { $('#name').html(node.value) });
    moosh.updatevalue('PCB_VERSION');
    moosh.updatevalue('BAT_V');
    moosh.updatevalue('NAME');

    // Channel 1 mapping can be current, temp or shared
    // Channel 2 mapping can be voltage, temp or shared
    // Shared mapping can be aux_v, resistance or diode
    // Analysis can be mean, rms or buffer
    moosh.setvalue('CH1:MAPPING', 'TEMP');
    moosh.setvalue('CH1:ANALYSIS', 'MEAN');
    //moosh.setvalue('CH2:MAPPING', 'VOLTAGE');
    moosh.setvalue('CH2:MAPPING', 'SHARED');
    moosh.setvalue('SHARED', 'AUX_V');
    moosh.setvalue('CH2:ANALYSIS', 'MEAN');

    moosh.setvalue('SAMPLING:RATE', '125');
    moosh.setvalue('SAMPLING:DEPTH', '32');
    moosh.setvalue('SAMPLING:TRIGGER', 'CONTINUOUS');
    //moosh.setvalue('NAME', 'Daniel\'s Mooshi');

    setStatus('Running');
    $(".graphcontainer").resizable({minWidth: 100, minHeight: 50});
    $(".graphcontainer").resizable({minWidth: 100, minHeight: 50});
    var ch1data = [];
    moosh.findnode('CH1:VALUE').callbacks.push(function (node) {
      var now = new Date().getTime();
      var degc = node.value - 273.15;
      var data = [];
      ch1data.push([node.lastupdate, degc]);
      ch1data.forEach(function(e) {
        if (now - e[0] < keeptime)
        data.push([(e[0] - now) / 1000, e[1]]);
      });
      $.plot('#ch1graph', [data], options);
      $('#ch1value').html(sprintf('+%.2f &deg;C', degc));
    });
    var ch2data = [];
    moosh.findnode('CH2:VALUE').callbacks.push(function (node) {
      var now = new Date().getTime();
      var data = [];
      ch2data.push([node.lastupdate, node.value]);
      ch2data.forEach(function(e) {
        if (now - e[0] < keeptime)
        data.push([(e[0] - now) / 1000, e[1]]);
      });
      $.plot('#ch2graph', [data], options);
      $('#ch2value').html(sprintf('%+.8f V', node.value));
      var mv = typeKdegtomV(moosh.findnode('CH1:VALUE').value);
      var t = typeKmVtodegC(mv + node.value * 1000) - 273.15;
      $('#thermvalue').html(sprintf('%+.8f degrees', t));
    });
    while (1) {
      // Tell the device we're still here
      await moosh.updatevalue('PCB_VERSION');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });
}var moosh = null;
var keeptime = 60 * 1000;
var options = {
  lines: {
    show: true
  },
  points: {
    show: true
  },
  xaxis: {
    min: -(keeptime / 1000),
    max: 0,
  },
  yaxis: {
    tickFormatter: function (n, o) {
      return sprintf("%+.2f", n);
    }
  },
};

function mooshidisconnect() {
  setStatus('Disconnected');
  try {
    if (moosh != null)
    moosh.disconnect();
  } catch (e) {
    console.log('Error disconnecting: ' + e);
  }
  // Reset widgets
  mooshisetup(false);
}

function mooshisetup(resetgraphs) {
  clearselects();
  if (resetgraphs) {
    $.plot('#ch1graph', [[]], options);
    $.plot('#ch2graph', [[]], options);
  }
  $('#pcbversion').html('-');
  $('#batv').html('-');
  $('#name').html('-');
}

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

function fillselect(nodename, id) {
  var n = moosh.findnode(nodename);
  clearselect(id);
  for (var i = 0; i < n.children.length; i++) {
    $(id).append(new Option(n.children[i].name, n.children[i].name));
  }
}

function clearselect(id) {
  $(id).empty();
  $(id).append('<option disabled selected value style="display:none">--</option>');
}

function clearselects() {
  clearselect('#rate');
  clearselect('#depth');
  clearselect('#channel1rangesel');
  clearselect('#channel2rangesel');
}

async function mooshimain() {
  await mooshiinner().catch((e) => {
    console.log('error ' + e);
    mooshidisconnect();
  });
}

function mooshiinner() {
  moosh = new Mooshimeter();
  //    setStatus('Requesting');
  return moosh.request()
  .then(async function () {
    setStatus('Configuring');
    fillselect('SAMPLING:RATE', '#rate');
    fillselect('SAMPLING:DEPTH', '#depth');
    fillselect('CH1:ANALYSIS', '#channel1analysissel');
    fillselect('CH2:ANALYSIS', '#channel2analysissel');
    bindselect(moosh, 'SAMPLING:RATE', '#rate');
    bindselect(moosh, 'SAMPLING:DEPTH', '#depth');
    bindselect(moosh, 'CH1:ANALYSIS', '#channel1analysissel');
    bindselect(moosh, 'CH2:ANALYSIS', '#channel2analysissel');
    moosh.nodecb('PCB_VERSION', (node) => { $('#pcbversion').html(node.value) });
    moosh.nodecb('BAT_V', (node) => { $('#batv').html(sprintf("%.2f V", node.value)) });
    moosh.nodecb('NAME', (node) => { $('#name').html(node.value) });
    moosh.updatevalue('PCB_VERSION');
    moosh.updatevalue('BAT_V');
    moosh.updatevalue('NAME');

    // Channel 1 mapping can be current, temp or shared
    // Channel 2 mapping can be voltage, temp or shared
    // Shared mapping can be aux_v, resistance or diode
    // Analysis can be mean, rms or buffer
    moosh.setvalue('CH1:MAPPING', 'TEMP');
    moosh.setvalue('CH1:ANALYSIS', 'MEAN');
    //moosh.setvalue('CH2:MAPPING', 'VOLTAGE');
    moosh.setvalue('CH2:MAPPING', 'SHARED');
    moosh.setvalue('SHARED', 'AUX_V');
    moosh.setvalue('CH2:ANALYSIS', 'MEAN');

    moosh.setvalue('SAMPLING:RATE', '125');
    moosh.setvalue('SAMPLING:DEPTH', '32');
    moosh.setvalue('SAMPLING:TRIGGER', 'CONTINUOUS');
    //moosh.setvalue('NAME', 'Daniel\'s Mooshi');

    setStatus('Running');
    $(".graphcontainer").resizable({minWidth: 100, minHeight: 50});
    $(".graphcontainer").resizable({minWidth: 100, minHeight: 50});
    var ch1data = [];
    moosh.findnode('CH1:VALUE').callbacks.push(function (node) {
      var now = new Date().getTime();
      var degc = node.value - 273.15;
      var data = [];
      ch1data.push([node.lastupdate, degc]);
      ch1data.forEach(function(e) {
        if (now - e[0] < keeptime)
        data.push([(e[0] - now) / 1000, e[1]]);
      });
      $.plot('#ch1graph', [data], options);
      $('#ch1value').html(sprintf('+%.2f &deg;C', degc));
    });
    var ch2data = [];
    moosh.findnode('CH2:VALUE').callbacks.push(function (node) {
      var now = new Date().getTime();
      var data = [];
      ch2data.push([node.lastupdate, node.value]);
      ch2data.forEach(function(e) {
        if (now - e[0] < keeptime)
        data.push([(e[0] - now) / 1000, e[1]]);
      });
      $.plot('#ch2graph', [data], options);
      $('#ch2value').html(sprintf('%+.8f V', node.value));
      var mv = typeKdegtomV(moosh.findnode('CH1:VALUE').value);
      var t = typeKmVtodegC(mv + node.value * 1000) - 273.15;
      $('#thermvalue').html(sprintf('%+.8f degrees', t));
    });
    while (1) {
      // Tell the device we're still here
      await moosh.updatevalue('PCB_VERSION');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });
}
