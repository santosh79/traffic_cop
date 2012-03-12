var frameHeaderSize = 4; //4 bytes to specify size of frame, i.e. max of 4GB

exports.mixinFrameManager = function(socket) {
  var sizeBuffer         = new Buffer(frameHeaderSize);
  var msgBuffer          = null;
  var sizeOfMsg          = null;
  var readingFrameHeader = true;
  var bytesLeftInSize    = frameHeaderSize;
  var bytesLeftInMsg     = 0;

  function resetMsgBuffer() {
    bytesLeftInSize    = frameHeaderSize;
    readingFrameHeader = false;
    sizeOfMsg          = sizeBuffer.readUInt32BE(0);
    msgBuffer          = new Buffer(sizeOfMsg);
    bytesLeftInMsg     = sizeOfMsg;
  }

  function resetSizeBuffer() {
    bytesLeftInMsg      = null;
    readingFrameHeader  = true;
    socket.emit("message", msgBuffer);
  }

  function readFrameSize(data) {
    if(data.length <= 0) { return; }

    //If we can read the frame size in this read
    if(bytesLeftInSize <= data.length) {
      //Copy into sizeBuffer
      var targetStart = frameHeaderSize - bytesLeftInSize;
      data.copy(sizeBuffer, targetStart, 0, bytesLeftInSize);
      var newData = data.slice(bytesLeftInSize);
      resetMsgBuffer();
      readMessage(newData);
    } else {
      //Copy over however much we can into the sizeBuffer
      var targetStart = frameHeaderSize - bytesLeftInSize;
      data.copy(sizeBuffer, targetStart);
      bytesLeftInSize -= data.length;
    }
  };

  function readMessage(data) {
    if(data.length <= 0) { return; }

    // If we can finish reading the msg now
    if(bytesLeftInMsg <= data.length) {
      var targetStart = sizeOfMsg - bytesLeftInMsg;
      data.copy(msgBuffer, targetStart, 0, bytesLeftInMsg);
      var newData = data.slice(bytesLeftInMsg);
      resetSizeBuffer();
      readFrameSize(newData);
    } else {
      //Copy over however much we can into the msgBuffer
      var targetStart = sizeOfMsg - bytesLeftInMsg;
      data.copy(msgBuffer, targetStart);
      bytesLeftInMsg -= data.length;
    }
  };

  function handleData(data) {
    readingFrameHeader ? readFrameSize(data) : readMessage(data);
  };

  //Mix in the writeMessage function
  socket.writeMessage = function(msg) {
    var message = Buffer.isBuffer(msg) ? msg : new Buffer(msg);
    var size = message.length;
    var buf = new Buffer(frameHeaderSize + size);
    buf.writeUInt32BE(size, 0);
    message.copy(buf, frameHeaderSize);
    socket.write(buf);
  }

  socket.on("data", handleData);
};

