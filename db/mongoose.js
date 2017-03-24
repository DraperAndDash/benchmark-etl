var mongoose = require('mongoose');
var options = {
  server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 0 } },
  replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 0 } }
};
mongoose.Promise = require('bluebird');
mongoose.connect(process.env.MONGODB_URI);

module.exports = {mongoose};
