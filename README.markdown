###Traffic Cop
Traffic Cop is a blazing fast, simple, pure JS messsaging system built on [NodeJS](http://nodejs.org/).

### Why another messaging system?
Most of what a messaging system does is [IO bound](http://en.wikipedia.org/wiki/IO_bound). This makes using a non-blocking IO framework like NodeJS a great fit. Multi-threaded servers are a great idea when you are CPU bound. With messaging systems on the other hand, they spend most of their time receiving packets, figuring out who to send them to and sending them. None, of these activities are CPU intensive.  Threading or even actor based models for high IO servers are just wrong and incredibly hard to debug. With TrafficCop the focus is three-fold:

1. Simplicity - Keep the project under 1K LOC. **No** external dependencies. No long/impenetrable spec (AMQP for example), just a simple, obvious [binary protocol](https://github.com/santosh79/traffic_cop/wiki/Protocol).
2. Performance - Traffic Cop uses a dead simple, binary, encoding free protocol. Your data can be in [messagepack](http://msgpack.org/), [JSON](http://json.org/) or any other custom encoding - traffic cop doesn't care. The advantage this has is that the traffic cop server needn't spend CPU cycles encoding/decoding packets, which makes it even more efficient at just shuffling data around.
3. Robustness - Codebase is obvious and well-tested. Most of the great tools you use for analyzing debugging NodeJS apps such as [DTrace](http://dtrace.org/blogs/) can be used.


### Installating the server
You'd need Node and NPM, so in case you do not have them head on over to [NodeJS.org](http://nodejs.org). If you have those, installing the server is as simple as:

	sudo npm install -g traffic_cop

#### Starting the server
	
	tc-server

The server defaults to running on port **3542**. You can change this by starting the server with the -p option:
	
	tc-server -p 3000

#### Connecting to the server
If you are using a language other than Javascript check out the [**clients page**](https://github.com/santosh79/traffic_cop/wiki/Clients) for listing of TrafficCop clients to find a listing in your language of choice.

If you are using NodeJS, in order to connect to the server, you'd need the [Traffic Cop Client](https://github.com/santosh79/traffic_cop_client) npm module. Go ahead and run:

	npm install traffic_cop_client

You can now publish and subscribe:

	var tc = require('traffic_cop_client');
	var publisher = tc.createClient('localhost', 3542);
	var subscriber = tc.createClient('localhost', 3542);
	
	subscriber.subscribe('channel_one', 'channel_two', 'channel_three');
	subscriber.on('message', function(channel, message) {
	  console.log('Got message %s on channel %s', message, channel);
	});
	
	setTimeout(function() {
	  publisher.publish('channel_one', 'Hi there');
	}, 2000);
	 
I plan on writing drivers for other languages as well, so programs written in say Ruby or Java can publish and subscribe to the Traffic Cop server. If you'd like to help write a driver in a language you know, please check out the [binary protocol](https://github.com/santosh79/traffic_cop/wiki/Protocol) to help get started.

####Author

Santosh Kumar :: santosh79@gmail.com :: @santosh79

#### LICENSE

(The MIT License) Copyright (c) 2012: "Santosh Kumar" Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 0:0
