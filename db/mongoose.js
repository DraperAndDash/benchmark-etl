var mongoose = require('mongoose');
var options = {
  server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
  replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
};
mongoose.Promise = require('bluebird');
mongoose.connect(process.env.MONGODB_URI, options);

module.exports = {mongoose};
