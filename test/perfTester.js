var tc = require('../lib/traffic_cop');
var client = tc.createClient();
var skt = client.socketToServer;

function publish() {
  client.publish('channel_one', 'Hi');
}
publish();
skt.on('drain', publish);
