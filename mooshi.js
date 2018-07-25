const NTYPES = {
    PLAIN: 0,
    LINK: 1,
    CHOOSER: 2,
    VAL_U8: 3,
    VAL_U16: 4,
    VAL_U32: 5,
    VAL_S8: 6,
    VAL_S16: 7,
    VAL_S32: 8,
    VAL_STR: 9,
    VAL_BIN: 10,
    VAL_FLT: 11,
    NOTSET: -1,
};
NTYPES.rev = [];
for (var k in NTYPES) {
    NTYPES.rev[NTYPES[k]] = k;
}

function Node() { };
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

Mooshimeter.prototype.request = function() {
    var me = this;
    // request device info, filtering out all that don't match the Mooshimeter service UUID:
    var service = navigator.bluetooth.requestDevice({ filters: [{ services: [ this.serviceUuid ] }] })
// Not sure why we're doing me.device when we've got this.device
	.then(device => {
	    me.device = device;
      // add an event listener for disconnect events:
	    me.device.addEventListener('gattserverdisconnected', me.disconnected);
      // try to connect, and return a successful connection:
	    return device.gatt.connect()})
      // get the primary Mooshimeter service:
	.then(server => server.getPrimaryService(this.serviceUuid));
    var serinpromise = service
    // now get the serin characteristic:
	.then(service => service.getCharacteristic(this.serinCharacteristicUuid))
  // copy it to me (again, not sure why)
	.then(characteristic => { me.serinCharacteristic = characteristic;
				});

    var seroutpromise = service
    // get the serout service:
  .then(service => service.getCharacteristic(this.seroutCharacteristicUuid))
  // start notifications on it:
	.then(characteristic => characteristic.startNotifications())
	.then(characteristic => {
    // add an event listener for changes on the serout service's characteristic:
	    characteristic.addEventListener('characteristicvaluechanged',
      // set a callback for the serout service's characteristic:
					    function (event) { me.seroutcb(event) });
      // again, what's with the me?
	    me.seroutCharacteristic = characteristic;
	});
// return promises for serin and serout:
    return Promise.all([serinpromise, seroutpromise])
    // update the
	.then(() => { me.connected = true;
          // sending a one-element byte array to the device:
		      return me.sendmsg(new Uint8Array([1]))})
          // then getting a promice in response:
	.then(() => { return new Promise((resolve, reject) => this.treecb = resolve)})
  // then sending the CRC to the device:
	.then(() => { return (me.sendcrc())});
};

// on a disconnect, update the instance's connect status:
Mooshimeter.prototype.disconnected = function(event) {
    this.connected = false;
};

// who calls gettree? At the moment, no one.
Mooshimeter.prototype.gettree = function() {
    return this.sendmsg(new Uint8Array([1])).then(rtn => {
	this.tree = rtn[0];
	this.revmap = rtn[1];
	//this.dumptree();
	return this.sendcrc();
    });
};

Mooshimeter.prototype.walk = function (fn) {
    var walkhelp = function (node, fn) {
	fn(node);
	for (var i = 0; i < node.children.length; i++) {
	    walkhelp(node.children[i], fn);
	}
    };
    walkhelp(this.tree, fn);
}

Mooshimeter.prototype.dumptree = function () {
    this.walk(function (node) {
	if (node.children.length == 0)
	    console.log(node.fullname);
    });
};

Mooshimeter.prototype.getvalue = function(k) {
    this.pending.next(this.getvalue(k))
	.then(this.findnode(k).callbacks.push(function (node) { return node.value }))
};

Mooshimeter.prototype.setvalue = function (k, v) {
    var pkt = this.serialisecommand(k, v);
    //console.log('Setting ' + k + ' to ' + pkt);
    return this.sendmsg(pkt);
};

Mooshimeter.prototype.updatevalue = function (k) {
    var pkt = this.serialisecommand(k, null);
    //console.log('update value ' + k + ': ' + pkt);
    return this.sendmsg(pkt);
};

Mooshimeter.prototype.sendcrc = function() {
    //console.log('Sending CRC ' + this.crc);
    return this.setvalue('ADMIN:CRC32', this.crc);
};

Mooshimeter.prototype.processtree = function (buf) {

    var inflator = new pako.Inflate();
    inflator.push(buf, true);
    if (inflator.err) {
	console.log('Decompression error: ' + inflator.msg);
	return;
    }

    var output = inflator.result;

    console.log('Decompressed ' + buf.length + ' to ' + output.length);
    //console.log(hexdump(output));
    var crc = CRC32.buf(buf);
    console.log('CRC ' + this.crc);
    var revmap = [];
    var tree = this.makechildren(output, {val: 0}, revmap)[0];
    // this is printing out the whole tree:
    console.log(tree);
    return [crc, tree, revmap];

};

Mooshimeter.prototype.seroutcb = function (event) {
    let data = new Uint8Array(event.target.value.buffer);
    var result = null;
    //console.log('Read ' + hexdump(data));
    if (this.rxseqn = -1)
	this.rxseqn = data[0];
    if (data[0] != this.rxseqn) {
	console.log('Sequence number error got ' + data[0] + ' expected ' + this.rxseqn);
	return;
    }
    this.rxseqn = (this.rxseqn + 1) & 0xff;
    data = data.slice(1);
    switch (this.state) {
      case 0:
	  var ofs = 0;
	  if (this.buf == null) {
	      if (data[0] != 1) {
		  console.log('Invalid packet type ' + data[0]);
		  return;
	      }
	      let buflen = data[2] << 8 | data[1];
	      this.buf = new Uint8Array(buflen);
	      //console.log('New buffer ' + buflen + ', ' + data[2]);
	      this.got = 0;
	      ofs = 3;
	  }

	  this.buf.set(data.subarray(ofs), this.got);
	  this.got += data.length - ofs;
	  if (this.got == this.buf.length) {
	      //console.log('Got all data');
	      this.state = 1;
	      [this.crc, this.tree, this.revmap] = this.processtree(this.buf);
	      this.buf = [];
	      this.treecb();
	      this.treecb = null;
	  }
	  break;

      case 1:
	  var me = this;
	  data.forEach(function (e) { me.buf.push(e) });
	  this.updatenodes();
	  result = true;
	  break;

      default:
	  console.log('Unknown state ' + this.state);
	  break;
    }
};

Mooshimeter.prototype.makechildren = function(buf, shortcode, revmap) {
    var decoder = new TextDecoder('ascii');
    var ofs = 0;
    var node = new Node();
    node.parent = null;
    node.children = []
    node.ntype = buf[0];
    node.value = null;
    node.lastupdate = null;
    node.callbacks = [];
    if (node.ntype >= NTYPES.CHOOSER) {
	revmap.push(node);
	node.shortcode = shortcode.val;
	shortcode.val++;
    } else {
	node.shortcode = -1;
    }
    var nlen = buf[1];
    node.name = decoder.decode(buf.slice(2, 2 + nlen));
    var nchildren = buf[nlen + 2];
    //console.log('name ' + node.name + ', children ' + nchildren + ', shortcode: ' + node.shortcode + ', type: ' + NTYPES.rev[node.ntype]);
    var amt = nlen + 3;
    for (var i = 0; i < nchildren; i++) {
	var [newnode, consumed] = this.makechildren(buf.subarray(amt), shortcode, revmap);
	newnode.parent = node;
	var stack = [newnode];
	var tmp = newnode;
	while (tmp.parent != null) {
	    stack.unshift(tmp.parent);
	    tmp = tmp.parent;
	};
	newnode.fullname = "";
	for (var j = 0; j < stack.length; j++) {
	    if (stack[j].name != "")
		newnode.fullname += stack[j].name + ':';
	}
	newnode.fullname = newnode.fullname.slice(0, -1);
	node.children.push(newnode);
	amt += consumed;
    }

    return [node, amt];
}

Mooshimeter.prototype.findnode = function(cmd) {
    var cmdsub = cmd.split(':');
    var searchtree = this.tree;
    for (var i = 0; i < cmdsub.length; i++) {
	var found = false;
	for (var j = 0; j < searchtree.children.length; j++) {
	    if (cmdsub[i] == searchtree.children[j].name) {
		found = true;
		searchtree = searchtree.children[j];
		break;
	    }
	}
	if (!found) {
	    throw 'Can\'t find ' + cmdsub[i] + ' at level ' + i;
	}
    }
    return searchtree;
};

Mooshimeter.prototype.nodecb = function (name, fn) {
    this.findnode(name).callbacks.push(fn);
};

Mooshimeter.prototype.cleardb = function (name) {
    this.findnode(name).callbacks = [];
};

Mooshimeter.prototype.serialisecommand = function(cmd, value) {
    var node = this.findnode(cmd);
    if (node == null) {
	return null;
    }
    var len = 1;
    if (value != null) {
	var payloadbuf = this.serialisepayload(value, node);
	len += payloadbuf.length;
    }
    var commandbuf = new Uint8Array(len);
    commandbuf[0] = node.shortcode;
    if (value != null) {
	commandbuf.set(payloadbuf, 1);
	commandbuf[0] |= 0x80; // Indicate write
    }
    return commandbuf;
}

Mooshimeter.prototype.serialisepayload = function(payload, node) {
    var arg = null;
    switch (node.ntype) {
      case NTYPES.CHOOSER:
	  var found = false;
	  for (var i = 0; i < node.children.length; i++) {
	      if (payload == node.children[i].name) {
		  found = true;
		  arg = new Uint8Array([i]);
	      }
	  }
	  if (!found) {
	      throw 'Unable to find payload ' + payload + ' in chooser ' + node;
	  }
	  break;

      case NTYPES.VAL_U8:
	  var tmp = parseInt(payload);
	  if (tmp < 0 || tmp > 255) {
	      throw 'Value out of range, must be 0-255';
	  }
	  arg = new Uint8Array([tmp]);
	  break;

      case NTYPES.VAL_U16:
	  var tmp = parseInt(payload);
	  if (tmp < 0 || tmp > 65535) {
	      throw 'Value out of range, must be 0-65535';
	  }
	  arg = new Uint16Array([tmp]);
	  break;

      case NTYPES.VAL_U32:
	  // Not that this makes much sense since the largest we'll get is 4294967295
	  var tmp = parseInt(payload) >>> 0;
	  if (tmp < 0 || tmp > ((-1) >>> 0)) {
	      throw 'Value out of range, must be 0-4294967295';
	  }
	  arg = new Uint32Array([tmp]);
	  break;

      case NTYPES.VAL_S8:
	  var tmp = parseInt(payload);
	  if (tmp < -128 || tmp > 127) {
	      throw 'Value out of range, must be -128-127';
	  }
	  arg = new Int8Array([tmp]);
	  break;

      case NTYPES.VAL_S16:
	  var tmp = parseInt(payload);
	  if (tmp < -32768 || tmp > 32767) {
	      throw 'Value out of range, must be -32768-32767';
	  }
	  arg = new Int16Array([tmp]);
	  break;

      case NTYPES.VAL_S32:
	  var tmp = parseInt(payload);
	  if (tmp < -2147483648 || tmp > 2147483647) {
	      throw 'Value out of range, must be -2147483648-2147483647';
	  }
	  arg = new Int32Array([tmp]);
	  break;

      case NTYPES.VAL_FLT:
	  var tmp = parseFloat(payload);
	  arg = new Float32Array([tmp]);
	  break;

      case NTYPES.VAL_STR:
	  var encoder = new TextEncoder('ascii');
	  var txt = encoder.encode(payload);
	  if (txt.length > 16) {
	      throw 'Payload too long';
	  }
	  var arg = new Uint8Array(txt.length + 2);
	  arg[0] = txt.length & 0xff;
	  arg[1] = (txt.length >> 8) & 0xff;
	  arg.set(txt, 2);
	  break;

      default:
	  throw 'Unknown payload type ' + NTYPES.rev[node.ntype];
    }
    return new Uint8Array(arg.buffer);
}

Mooshimeter.prototype.updatenodes = function () {
    while (1) {
	var avail = this.buf.length;
	if (avail < 1)
	    return;
	// Peek at the type and then work out if we have enough data for it
	var nodeidx = this.buf[0];
	if (nodeidx >= this.revmap.length) {
	    console.log('Unknown node index ' + nodeidx);
	    this.buf = [];
	    return;
	}
	var node = this.revmap[nodeidx];
	var dtype = null;
	var dlen;
	switch (node.ntype) {
	  case NTYPES.VAL_U8:
	      dtype = Uint8Array;
	      break;
	  case NTYPES.VAL_U16:
	      dtype = Uint16Array;
	      break;
	  case NTYPES.VAL_U32:
	      dtype = Uint32Array;
	      break;
	  case NTYPES.VAL_S8:
	      dtype = Int8Array;
	      break;
	  case NTYPES.VAL_S16:
	      dtype = Int16Array;
	      break;
	  case NTYPES.VAL_S32:
	      dtype = Int32Array;
	      break;
	  case NTYPES.VAL_FLT:
	      dtype = Float32Array;
	      break;
	  case NTYPES.VAL_STR:
	      if (avail < 1 + 2) {
		  //console.log('Not enough data available to get string length');
		  return;
	      }
	      dlen = new Uint16Array(new Uint8Array(this.buf.slice(1, 1 + 2)).buffer)[0];
	      if (avail < 1 + 2 + dlen) {
		  //console.log('Not enough data available to get string ' + (dlen + 1 + 2));
		  return;
	      }
	      var decoder = new TextDecoder('ascii');
	      node.value = decoder.decode(new Uint8Array(this.buf.slice(1 + 2, 1 + 2 + dlen)));
	      dlen += 2; // Tell later code we need to get rid of the length as well
	      break;
	  case NTYPES.CHOOSER:
	      if (avail < 1 + 1) {
		  //console.log('Not enough data available for chooser');
		  return;
	      }
	      var idx = this.buf[1];
	      if (idx > node.children.length) {
		  console.log('Chooser index ' + idx + ' out of range');
		  console.log(node);
		  return;
	      }
	      node.value = node.children[idx].name;
	      dlen = 1;
	      break;
	  default:
	      console.log('Unknown node type ' + NTYPES.rev[node.ntype]);
	      this.buf = [];
	      return;
	}
	if (dtype != null) {
	    dlen = dtype.BYTES_PER_ELEMENT;
	    if (avail < 1 + dlen) {
		//console.log('Not enough data to get value ' + (1 + dlen));
		return;
	    }
	    node.value = new dtype(new Uint8Array(this.buf.slice(1, 1 + dlen)).buffer)[0];
	}
	node.lastupdate = new Date().getTime();

	// Pop off the data we have consumed (data len +1 for short code)
	//console.log('Shifting ' + (dlen + 1));
	for (var i = 0; i < dlen + 1; i++)
	    this.buf.shift();

	//console.log('Updating ' + node.fullname + ' to ' + node.value);
	for (var i = 0; i < node.callbacks.length; i++)
	    node.callbacks[i](node);
    }
};

Mooshimeter.prototype.sendmsg = function (buf) {
    if (this.connected == false)
	throw 'attempt to talk to a disconnected device';
    var wrappedbuf = new Uint8Array(buf.length + 1);
    wrappedbuf[0] = this.txseqn;
    this.txseqn = (this.txseqn + 1) & 0xff;
    wrappedbuf.set(buf, 1);
    //console.log('Queueing write ' + hexdump(buf));
    console.log('Queueing write ');
    	this.serinCharacteristic.writeValue(wrappedbuf);
  //   this.sendq.defer((cb) => {
	// this.serinCharacteristic.writeValue(wrappedbuf)
	//     .then(() => {
	// 	cb();
	//     })
  //   });
}

Mooshimeter.prototype.disconnect = function () {
    if (this.device == null)
	return;
    this.device.gatt.disconnect();
};
