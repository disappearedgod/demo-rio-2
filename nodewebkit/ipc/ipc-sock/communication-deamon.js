// TODO: implements the server for reciving RPC requests from clients
//   and register/unregister requests from services
var net = require('net');

// Elements of this cache are objects like: {
//  val: the real value
//  age: the age of this value
// }, by default.
function Cache(capacity, stratagy) {
  this._capacity = capacity || 10;
  this._size = 0;
  this._c = new Array(capacity);
  if(typeof stratagy !== 'undefined') {
    if(typeof stratagy.init === 'undefined' 
        || typeof stratagy.update === 'undefined'
        || typeof stratagy.repTarget === 'undefined') {
      this._init = this._born;
      this._update = this._older;
      this._repTarget = this._findOldest;
    } else {
      this._init = stratagy.init;
      this._update = stratagy.update;
      this._repTarget = stratagy.repTarget;
    }
  }
}

Cache.prototype.get = function(key) {
  if(typeof this._c[key] !== 'undefined') {
    // TODO: change the corresponding LRU perameter
    this._update(key, this._c);
    return this._c[key].val;
  }
  throw 'Not found';
}

Cache.prototype.set = function(key, val) {
  // By default, remove the LRU obj if cache has full
  if(this._size == this._capacity) {
    this._repTarget(this._c);
    this._size--;
  }
  this._c[key] = {
    val: val
  };
  this._init(key, this._c);
  this._size++;
}

Cache.prototype._born = function(key, list) {
  list[key].age = 1;
}

Cache.prototype._older = function(key, list) {
  list[key].age = 0;
  for(var k in list) {
    list[k].age++;
  }
}

Cache.prototype._findOldest = function(list) {
  var oldest = 0, oKey = null;
  for(var k in list) {
    if(list[k].age > oldest) {
      oldest = list[k].age;
      oKey = k;
    }
  }
  // release the corresponding resource
  try {
    list[key].val.release();
    list[key] = null;
    delete list[key];
  } catch(e) {
    console.log(e);
  }
}

function PeerEnd() {
  this._port = 56765;
  this._svrObj = new Cache(20);
  this._svrList = [];
  this._connList = new Cache(20, {
    init: function(key, list) {
      list[key].timer = setTimeout(function() {
        try {
          list[key].val.release();
          list[key] = null;
          delete list[key];
          console.log('Connection to', key, 'has been closed');
        } catch(e) {
          console.log(e);
        }
      }, 120000);
    },
    update: function(key, list) {
      clearTimeout(list[key].timer);
      list[key].timer = setTimeout(function() {
        try {
          list[key].val.release();
          list[key] = null;
          delete list[key];
          console.log('Connection to', key, 'has been closed');
        } catch(e) {
          console.log(e);
        }
      }, 120000);
    },
    repTarget: function(list) {
      // need do nothing
    }
  })

  this._init();
}

PeerEnd.prototype._init = function() {
  // TODO: start up a server
  var self = this,
      server = self._server = net.createServer(self._accept);
  server.listen(self._port, function() {
    console.log('This peer is listening on', server.address());
  });
  server.on('error', function(e) {
    // TODO: handle errors occured on server
  });
}

PeerEnd.prototype._destroy = function() {
  // TODO: close all connections and server
  this._server.close();
}

PeerEnd.prototype._accept = function(cliSock) {
  // TODO: varify this connection
  cliSock.on('data', function(data) {
    // TODO: make sure this is a completed data packet
    this._dispatcher(data);
  }).on('end', function() {
    // TODO: handle client disconnect
  });
}

PeerEnd.prototype._packet = function(content) {
  // TODO: put content into a data packet
  return content;
}

PeerEnd.prototype._unpack = function(packet) {
  // TODO: get content from data packet
  return packet;
}

PeerEnd.prototype._dispatcher = function(msg) {
  // TODO: handle msgs from clients
}

// TODO: maintain a connection for seconds, close idle connections
//  which have none communication with the peer out of time.
PeerEnd.prototype._getConnection = function(ip) {
  var client;
  try {
    client = this._connList.get(ip);
  } catch(e) {
    client = net.connect({
      host: ip,
      port: this._port
    }, function() {
      // TODO: connected successfully
    });
    client.setKeepAlive(true);
    client.release = client.destroy;
    this._connList.set(ip, client);
    client.on('data', function(data) {
      // TODO: handle data from server
    }).on('end', function() {
      // TODO: disconnected from server
    });
  }
  return client;
}

// TODO: API for clients to send sth to peers
PeerEnd.prototype.send = function(dstAddr, content) {
  if(net.isIP(dstAddr) == 0)
    return 'Invalid IP address';
  var conn = this._getConnection(dstAddr);
  conn.write(this._packet(content), function() {
    // TODO: do sth after sending packet
  });
}

// TODO: API for clients to register services
PeerEnd.prototype.register = function(svrName, svrAddr) {}

// TODO: API for clients to unregister services
PeerEnd.prototype.unregister = function(svrName) {}

function main() {
  var peer = new PeerEnd();
  // TODO: register PeerEnd on local IPC framework to be a service
}

main();

