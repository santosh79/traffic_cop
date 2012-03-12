var manageFrames = require('../lib/frame_manager'), 
    assert = require('assert'),
    fs = require('fs'),
    events = require('events');

describe("Frame Manager usage", function() {
  it("is meant to be used as a mixin", function() {
    var cnxn = Object.create(events.EventEmitter.prototype);
    manageFrames.mixinFrameManager(cnxn);
  });

  it("tacks on size to packets when being written", function(done) {
    var obj = Object.create(events.EventEmitter.prototype);
    obj["write"] = function(data) {
      var msg = data.slice(4);
      assert.equal(msg.toString(), "Hello World!");
      done();
    };

    var buf = new Buffer("Hello World!");
    manageFrames.mixinFrameManager(obj);
    obj.writeMessage(buf);
  });

  describe("reassembling split packets", function() {
    // The frame manager & the object it's mixed into
    it("works with one packet", function(done) {
      var cnxn = Object.create(events.EventEmitter.prototype);
      manageFrames.mixinFrameManager(cnxn);

      var frameSize = 4;
      var frameHeader = new Buffer(frameSize);
      var message = "Hello World!";
      frameHeader.writeUInt32BE(message.length,0);

      //Split the frame header into two to ensure it handles
      //split headers
      var firstHalfOfHeader = frameHeader.slice(0, (frameSize/2)), 
        secondHalfOfHeader = frameHeader.slice(frameSize/2);
      cnxn.emit("data", firstHalfOfHeader);
      cnxn.emit("data", secondHalfOfHeader);

      // Split the message in two as well
      var firstHalf = new Buffer(message.slice(0,5)), 
        secondHalf = new Buffer(message.slice(5));
      cnxn.emit("data", firstHalf);
      process.nextTick(function() { cnxn.emit("data", secondHalf); });

      //Ensure you get the whole message as expected
      cnxn.on("message", function(msg) {
        assert.equal("Hello World!", msg);
        done();
      });
    });

    it("works with more than one packet", function(done) {
      var cnxn = Object.create(events.EventEmitter.prototype);
      manageFrames.mixinFrameManager(cnxn);

      var frameSize = 4;
      var frameHeader = new Buffer(frameSize);
      var message = fs.readFileSync('./test/sample.jpg');
      frameHeader.writeUInt32BE(message.length,0);

      var nextFrameHeader = new Buffer(frameSize);
      var nextMessage = new Buffer("Bye");
      nextFrameHeader.writeUInt32BE(nextMessage.length,0);

      var totalLength = frameHeader.length + message.length + nextFrameHeader.length + nextMessage.length;
      var firstBuffer = new Buffer(totalLength);
      frameHeader.copy(firstBuffer);
      message.copy(firstBuffer,frameHeader.length);
      nextFrameHeader.copy(firstBuffer, (frameHeader.length + message.length));
      nextMessage.copy(firstBuffer, (frameHeader.length + message.length + nextFrameHeader.length));

      (function emitData(buffer) {
        var curSplit = Math.min(buffer.length, 500);
        var slicedBuffer = buffer.slice(0, curSplit);
        cnxn.emit('data', slicedBuffer);
        if(curSplit === 500) {
          process.nextTick(function() { emitData(buffer.slice(curSplit)); });
        }
      }(firstBuffer));

      var cnt = 0;
      cnxn.on("message", function(msg) {
        if(++cnt === 1) {
          var contents = fs.readFileSync('./test/sample.jpg');
          assert.equal(contents.toString(), msg.toString());
        } else {
          assert.equal("Bye", msg);
          assert.equal(cnt, 2);
          done();
        }
      });
    });
  });

});
