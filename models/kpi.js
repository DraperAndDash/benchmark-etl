var mongoose = require('mongoose');

var KPISchema = new mongoose.Schema({
    KPI_ID : Number,
    KPI_name : String,
    KPI_description : String,
    KPI_area : String,
    datasource : String,
    frequency : String,
    format : String
});

KPISchema.statics.findByKPI_ID = function (kpiId) {
  var KPI = this;

  return KPI.find({
    'KPI_ID': kpiId
  });
};

KPISchema.statics.getAll = function () {
  var KPI = this;

  return KPI.find({});
};

KPISchema.statics.count = function () {
  var KPI = this;

  return KPI.count({});
};

var kpi = mongoose.model('kpi', KPISchema);

module.exports = {kpi};
