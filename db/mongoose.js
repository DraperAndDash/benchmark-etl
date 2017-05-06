var mongoose = require('mongoose');
var options = {server: {reconnectTries: Number.MAX_VALUE}
};
mongoose.Promise = require('bluebird');
mongoose.connect(process.env.MONGODB_URI);

module.exports = {mongoose};
