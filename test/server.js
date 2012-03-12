var rl = require('readline'),
    fm = require('../lib/frame_manager'),
    net = require('net'),
    client = null;

var i = rl.createInterface(process.stdin, process.stdout, null);

i.question("1: Connect to Server\n2:Disconnect", function(answer) {
  if(answer === '1') {
    connectToServer();
  } else {
    disconnectFromServer();
  }
});

function handleMessage(msg) {
  console.log("\nclient received: %s", msg.toString());
}

function disconnectFromServer() {
  console.log("disconnecting....");
  client && client.end();
  setTimeout(function() {
    i.close();
    process.stdin.destroy();
    process.exit(0);
  }, 1000);
}

function connectToServer(prt) {
  var port = prt || 3542;
  client = net.connect(port, function() { //'connect' listener
      console.log('client connected');
      pubSubPrompt();
  });
  fm.mixinFrameManager(client);
  client.on("message", handleMessage);
  client.on('end', function() {
    console.log('server disconnected');
    disconnect();
  });
}

function constructMsgHeader(buffer, msgType, channel) {
  buffer.writeUInt8(msgType, 0); // Writing the message type 1: for publish
  buffer.writeUInt32BE(channel.length, 1);

  var channelBuffer = new Buffer(channel);
  channelBuffer.copy(buffer, 1 + 4);
}

function publishPrompt() {
  i.question("Channel?: ", function(channel) {
    i.question("Message?: ", function(msg) {
      var wireMessage = new Buffer(1 + 4 + channel.length + msg.length);
      constructMsgHeader(wireMessage, 0x1, channel);

      var messageBuffer = new Buffer(msg);
      messageBuffer.copy(wireMessage, 1 + 4 + channel.length);
      client.writeMessage(wireMessage);
      pubSubPrompt();
    });
  });
}

function subscribePrompt() {
  i.question("Comma seperated list of channels?: ", function(channel) {
    var wireMessage = new Buffer(1 + 4 + channel.length);
    constructMsgHeader(wireMessage, 0x2, channel);
    client.writeMessage(wireMessage);
  });
}

function pubSubPrompt() {
  i.question("1:Publish\n2:Subscribe\n3:Disconnect", function(answer) {
    if(answer === '1') {
      publishPrompt();
    } else if(answer === '2') {
      subscribePrompt();
    } else {
      disconnectFromServer();
    }
  });
}

process.on('SIGINT', function() {
  disconnectFromServer();
});
