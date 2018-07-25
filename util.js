function hexdump(data) {
    const linelen = 16;
    let a = [];
    let b = [];
    for (let i = 0; i < data.length; i++) {
	a.push(('00' + data[i].toString(16)).slice(-2));
	if (data[i] > 31 && data[i] < 127)
	    b.push(String.fromCharCode(data[i]));
	else
	    b.push('.');
    }

    lines = [];
    for (let i = 0; i < a.length / linelen; i++) {
	let addrpart = String("0000" + i * linelen).slice(-4);
	let hexpart = a.slice(i * linelen, i * linelen + linelen).join(' ');
	let txtpart = b.slice(i * linelen, i * linelen + linelen).join('');
	lines.push(addrpart + ': ' + hexpart + '    |' + txtpart + '|');
    }
    return(lines.join('\n'));
}

// Convert millivolts from a type K thermocouple to degrees Celcius
// https://github.com/andygock/Thermocouple/blob/master/tc.py#L330
function typeKmVtodegC(mv) {
  var tab1 = [
    0.0000000E+00,
    2.5173462E+01,
    -1.1662878E+00,
    -1.0833638E+00,
    -8.9773540E-01,
    -3.7342377E-01,
    -8.6632643E-02,
    -1.0450598E-02,
    -5.1920577E-04,
    0.0000000E+00,
  ];

  var tab2 = [
    0.000000E+00,
    2.508355E+01,
    7.860106E-02,
    -2.503131E-01,
    8.315270E-02,
    -1.228034E-02,
    9.804036E-04,
    -4.413030E-05,
    1.057734E-06,
    -1.052755E-08,
  ];

  var tab3 = [
    -1.318058E+02,
    4.830222E+01,
    -1.646031E+00,
    5.464731E-02,
    -9.650715E-04,
    8.802193E-06,
    -3.110810E-08,
    0.000000E+00,
    0.000000E+00,
    0.000000E+00,
  ];

  if (mv > -5.891 && mv <= 0.0) {
    c = tab1;
  } else if (mv > 0.0 && mv <= 20.644) {
    c = tab2;
  } else if (mv > 20.644 && mv <= 54.886) {
    c = tab3
  } else {
    return Nan;
  }

  t = 0.0;
  for (var p = 0; p < c.length; p++) {
    t += c[p] * Math.pow(mv, p);
  }
  return t;
}

// https://github.com/andygock/Thermocouple/blob/master/tc.py#278
function typeKdegtomV(degc) {
  var tab1 = [
    0.000000000000E+00,
    0.394501280250E-01,
    0.236223735980E-04,
    -0.328589067840E-06,
    -0.499048287770E-08,
    -0.675090591730E-10,
    -0.574103274280E-12,
    -0.310888728940E-14,
    -0.104516093650E-16,
    -0.198892668780E-19,
    -0.163226974860E-22,
  ];

  var tab2 = [
    -0.176004136860E-01,
    0.389212049750E-01,
    0.185587700320E-04,
    -0.994575928740E-07,
    0.318409457190E-09,
    -0.560728448890E-12,
    0.560750590590E-15,
    -0.320207200030E-18,
    0.971511471520E-22,
    -0.121047212750E-25,
  ];

  var a0 = 0.118597600000E+00;
  var a1 = -0.118343200000E-03;
  var a2 = 0.126968600000E+03;

  if (degc > -270 && degc <= 0) {
    c = tab1;
  } else if (degc >0 && degc <= 1372) {
    c = tab2;
  } else {
    return NaN;
  }

  var e = 0;
  for (var p = 0; p < c.length; p++) {
    e += c[p] * Math.pow(degc, p);
  }
  if (degc > 0) {
    e += a0 * Math.exp(a1 * Math.pow(degc - a2, 2));
  }

  return e;
}
