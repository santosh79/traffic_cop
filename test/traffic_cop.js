var trafficCop = require('../lib/traffic_cop'), 
    assert = require('assert'),
    fs = require('fs'),
    events = require('events');

describe("Traffic Cop", function() {
  describe("#initialization", function () {
    it("requires a port and host on which the server is running", function() {
      var client = trafficCop.createClient("8.8.8.8", 3542);
    });
    it("defaults to localhost and 3542", function() {
      var client = trafficCop.createClient();
      assert.equal(client.getServerInfo().host, "localhost");
      assert.equal(client.getServerInfo().port, 3542);
    });
  });

  describe("#publishing and subscribing", function() {
    describe("with one publisher and one subscriber", function() {
      var sub = trafficCop.createClient('192.168.1.227'), pub = trafficCop.createClient('192.168.1.227');
      it("the subscriber gets messages sent on a channel", function(done) {
        sub.subscribe("channel_uno", "channel_dos");
        var contents = fs.readFileSync('./test/sample.jpg');
        sub.on("message", function(channel, msg) {
          assert.equal(channel, 'channel_dos');
          assert.equal(msg.toString(), contents.toString());
          done();
        });
        setTimeout(function() {
          pub.publish("channel_dos", contents);
        }, 100);
      });
    });
    describe("with two subscribers and one publisher", function() {
      describe("and both subscribers subscribed to the same channels", function() {
        var pub = null, subOne = null, subTwo = null;
        beforeEach(function() {
          pub = trafficCop.createClient(), subOne = trafficCop.createClient(), subTwo = trafficCop.createClient();
          [subOne, subTwo]. forEach(function(sub) { sub.subscribe("channel_tres", "channel_quatro"); });
        });

        it("both subscribes get the message", function(done) {
          var msgCnt = 0;
          function checkIfDone() { (++msgCnt === 2) && done(); }
          subOne.on("message", function(channel, msg) { assert.equal(msg, "Test"); checkIfDone(); });
          subTwo.on("message", function(channel, msg) { assert.equal(msg, "Test"); checkIfDone(); });
          setTimeout(function() { pub.publish("channel_quatro", "Test"); }, 10);
        });
      });

      describe("and the subscribers subscribed to different channels", function() {
        var pub = null, subOne = null, subTwo = null;
        beforeEach(function() {
          pub = trafficCop.createClient(), subOne = trafficCop.createClient(), subTwo = trafficCop.createClient();
          subOne.subscribe("channel_quinto");
          subTwo.subscribe("channel_septo");
        });

        it("only one of them gets the message", function(done) {
          var msgCnt = 0;
          subOne.on("message", function(channel, msg) {
            assert.equal(msg, "Foo bar");
            ++msgCnt;
          });
          subTwo.on("message", function(channel, msg) {
            assert.equal(1, 2, 'subTwo should NOT be getting a message');
          });
          setTimeout(function() { pub.publish("channel_quinto", "Foo bar"); }, 10);
          setTimeout(function() {
            assert.equal(1, msgCnt);
            done();
          }, 30);
        });
      });
    });
  });
});

