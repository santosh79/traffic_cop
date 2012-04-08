#! /usr/bin/env node
var tcClient = require('./traffic_cop');
var rl = require('readline');
var events = require('events');

var args = process.argv.slice(2);

var host, port;
(function parseArgs() {
  var i = 0;
  while(i < args.length) {
    if(args[i] === '-h') {
      host = args[i+1];
    } else if(args[i] === '-p') {
      port = args[i+1];
    } else {
    }
    i += 2;
  }
}());

var client = tcClient.createClient(host, port);

var outputStream = Object.create(events.EventEmitter.prototype);

var rlInterface = rl.createInterface(process.stdin, process.stdout);

var cmdLinePrompt = 'tc ' + client.host + ':' + client.port + ">";
rlInterface.setPrompt(cmdLinePrompt, (cmdLinePrompt.length + 1));
rlInterface.prompt();

rlInterface.on('line', function(line) {
  var args = line.split(/\s+/);
  var action = args[0];
  if(action === 'publish') {
    var channel = args[1], msg = args[2];
    client.publish(channel, msg);
    process.nextTick(function() { rlInterface.prompt(); });
  } else if(action === 'subscribe') {
    var channels = args.slice(1);
    client.subscribe(channels);
    console.log('Subscribed to channels %s', channels);
    client.on('message', function(ch, msg) {
      console.log('channel %s: %s', ch, msg.toString());
    });
  }
});

rlInterface.on('close', quit);
function quit() {
  console.log('\nBye...');
  process.stdin.destroy();
  process.exit(0);
}
