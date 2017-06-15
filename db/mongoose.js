var mongoose = require('mongoose');
var options = {
  server: { 
    reconnectTries: Number.MAX_VALUE, 
    socketOptions: { 
      keepAlive: 1, 
      connectTimeoutMS: 0 
    } 
  },
  replset: { 
    socketOptions: { 
      keepAlive: 1, 
      connectTimeoutMS: 0 
    } 
  }
};
mongoose.Promise = require('bluebird');
mongoose.connect(process.env.MONGODB_URI, {auth:{authdb:"admin"}});

module.exports = {mongoose};
