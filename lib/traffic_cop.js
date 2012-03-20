var events              = require('events');
var subscriptionGlobals = Object.create(events.EventEmitter.prototype);
var net                 = require('net');
var fm                  = require('./frame_manager');

function Client(host, port) {
  this.host = host ? host : "localhost";
  this.port = port ? port : 3542;
  this.connectToServer();
}

Client.prototype = Object.create(events.EventEmitter.prototype);

Client.prototype.connectToServer = function() {
  var that = this;
  that.socketToServer = net.connect(that.port, that.host);
  fm.mixinFrameManager(that.socketToServer);
  that.socketToServer.on("message", function(msg) {
    var channelLength = msg.readUInt32BE(0);
    var channel       = msg.slice(4).slice(0, channelLength);
    var actualMsg     = msg.slice((4 + channelLength));
    that.emit("message", channel, actualMsg);
  });
  that.socketToServer.on('end', function() { that.disconnect(); });
}

Client.prototype.disconnect = function() {
  console.log("disconnecting....");
  this.socketToServer.end();
}

Client.prototype.getServerInfo = function() {
  return { host : this.host, port : this.port };
}

Client.prototype.publish = function(channel, msg) {
  var that = this;
  if(that.subscribed) {
    console.error("You have subscribed to a channel using this connection and connect publish using this.\r\nCreate a new connection object instead");
    return;
  }
  var channelLength = Buffer.byteLength(channel);
  var wireMessage = new Buffer(1 + 4 + channelLength + msg.length);
  wireMessage.writeUInt8(0x1, 0);
  wireMessage.writeUInt32BE(channelLength, 1);
  wireMessage.write(channel, 5);

  (Buffer.isBuffer(msg)) ? msg.copy(wireMessage, (5 + channelLength)) :
			   wireMessage.write(msg, (5 + channelLength));

  that.socketToServer.writeMessage(wireMessage);
};

Client.prototype.subscribe = function() {
  var that = this, channels = Array.prototype.slice.call(arguments).join(",");

  var wireMessage = new Buffer(1 + 4 + Buffer.byteLength(channels));
  wireMessage.writeUInt8(0x2, 0);
  var channelLength = Buffer.byteLength(channels);
  wireMessage.writeUInt32BE(channelLength, 1);
  wireMessage.write(channels, 5);
  that.socketToServer.writeMessage(wireMessage);
}

exports.createClient = function(host, port) {
  return new Client(host, port);
}
