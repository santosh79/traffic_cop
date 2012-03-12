#! /usr/bin/env node

var args = process.argv.slice(2);
var port = (args[0] === '-p') ? args[1] : null;

var tcServer = require('./server').createServer(port);
tcServer.start();
