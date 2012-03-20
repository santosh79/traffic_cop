#! /usr/bin/env node
var tcClient = require('./traffic_cop');
var rl = require('readline');
var events = require('events');

var args = process.argv.slice(2);

var i = 0;
while(i < args.length) {
  if(args[i] === '-h') {
    var host = args[i+1];
  } else if(args[i] === '-p') {
    var port = args[i+1];
  } else {
  }
  i += 2;
}

var client = tcClient.createClient(host, port);

var outputStream = Object.create(events.EventEmitter.prototype);

outputStream.write = function (data) {
  console.log(data.toUpperCase());
}

var rlInterface = rl.createInterface(process.stdin, outputStream, function(linePartial) {
  return [[
    linePartial + '1',
    linePartial + '2'
  ], linePartial];
});

var cmdLinePrompt = 'tc ' + client.host + ':' + client.port + ">";
rlInterface.setPrompt(cmdLinePrompt, (cmdLinePrompt.length + 1));
rlInterface.prompt();


rlInterface.on('close', quit);
function quit() {
  console.log('');
  process.stdin.destroy();
  process.exit(0);
}
