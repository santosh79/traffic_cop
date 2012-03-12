var net = require('net'),
    fm = require('./frame_manager'),
    events = require('events'),
    subscriptions = Object.create(events.EventEmitter.prototype);

function Server(port) {
  this.port = port || 3542;
}

Server.prototype.start = function() {
  var server = net.createServer(Connection);
  server.listen(this.port, function() {
    console.log("server is up on %d", server.address()['port']);
  });
};

function Connection(remoteSocket) {
  var remotePort = remoteSocket.remotePort, 
      remoteAddress = remoteSocket.remoteAddress,
      channels = null;

  console.log("connection at port %d and host %s", remotePort, remoteAddress );

  (function initializer() {
    fm.mixinFrameManager(remoteSocket);
    remoteSocket.on("message", handleMessage);
    remoteSocket.on("end", unsubscribe);
    remoteSocket.setNoDelay(true);
  }());

  function handleMessage(msg) {
    var msgType = msg.readUInt8(0);
    if(msgType === 0x1) {
      handlePublishMessage(msg);
    } else if(msgType === 0x2) {
      handleSubscribeMessage(msg);
    } else {
      console.error("Invalid message %j", msg);
    }
  }

  function handlePublishMessage(msg) {
    var channelLength = msg.readUInt32BE(1);
    var channel       = msg.slice(5).slice(0, channelLength).toString();
    var actualMessage = msg.slice(5 + channelLength);
    subscriptions.emit(('channel|' + channel), channel, actualMessage);
  }

  function sendMessageToSubscriber(channel, msg) {
    var channelLength = Buffer.byteLength(channel);
    var sendBuffer    = new Buffer(4 + channelLength + msg.length);

    //Write the channel stuff
    sendBuffer.writeUInt32BE(channelLength, 0);
    sendBuffer.write(channel, 4);

    //Write in the msg
    Buffer.isBuffer(msg) ?  msg.copy(sendBuffer, (4 + channelLength)) : 
                            sendBuffer.write(msg, (4 + channelLength));

    remoteSocket && remoteSocket.writeMessage(sendBuffer);
  }

  function handleSubscribeMessage(msg) {
    var channelLength = msg.readUInt32BE(1);

    //Reconstruct the comma-seperated channels
    channels = msg.slice(5).slice(0, channelLength).toString().split(',').map(function(ch) {
      return ch.replace(/\s/g, '');
    });

    //Subscribe to each of them
    channels.filter(function(ch) { 
      return ch.length > 0;
    }).forEach(function(channel) {
      subscriptions.on(('channel|' + channel), sendMessageToSubscriber);
    });
  }

  function unsubscribe() {
    channels && channels.forEach(function(channel) {
      subscriptions.removeListener(('channel|' + channel), sendMessageToSubscriber);
    });
    console.log("client at %s and port %d just signed off", remoteAddress, remotePort);
  }

}

exports.createServer = function(port) {
  var server = new Server(port);
  return server;
};
