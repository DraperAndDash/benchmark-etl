var mongoose = require('mongoose');

var KPIValueSchema = new mongoose.Schema({
    KPI_ID : Number,
    Period : String,
    Provider : String,
    Value : String,
    created_From: String,
    created_At: {
      type: Date,
      required: true,
      default: Date.now
    },
    deleted_At: {type: Date, default: null}, // Timestamp when/if document is deleted
    deleted_By: {type: String, default: null} // This needs to be user_id who deleted document
});

KPIValueSchema.statics.findByKPI_ID = function (kpiId) {
  var KPIValue = this;

  return KPIValue.find({
    'KPI_ID': kpiId,
    'deleted_At': null
  });
};

KPIValueSchema.statics.findByIDPeriod = function (id, period) {
  var KPIValue = this;

  return KPIValue.findOne({
    'KPI_ID': id,
    'Period': period,
    'deleted_At': null
  });
};

KPIValueSchema.statics.getAll = function () {
  var KPIValue = this;

  return KPIValue.find({'deleted_At': null});
};

var KPIValue = mongoose.model('KPIValue', KPIValueSchema);

module.exports = {KPIValue};