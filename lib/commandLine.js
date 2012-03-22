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

var rlInterface = rl.createInterface(process.stdin, process.stdout);

var cmdLinePrompt = 'tc ' + client.host + ':' + client.port + ">";
rlInterface.setPrompt(cmdLinePrompt, (cmdLinePrompt.length + 1));
rlInterface.prompt();
rlInterface.on('line', function(action) {
  process.nextTick(function() { rlInterface.prompt(); });
});

rlInterface.on('close', quit);
function quit() {
  console.log('\nBye...');
  process.stdin.destroy();
  process.exit(0);
}
