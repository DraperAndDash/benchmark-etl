/* kpi-value.js
Mongoose model and functions for the kpivalue collection
*/
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const KPIValueSchema = new mongoose.Schema({
    KPI_ID : Number,
    Period : String,
    Provider : String,
    Provider_Code : String,
    Value : String,
    created_From: String,
    created_At: {
      type: Date,
      required: true,
      default: Date.now
    },
    deleted_At: {type: Date, default: null}, 
    deleted_By: {type: String, default: null}
});

KPIValueSchema.index({KPI_ID: 1, Period: 1, Provider: 1, Provider_Code: 1}, {unique: true})

KPIValueSchema.plugin(mongoosePaginate);

KPIValueSchema.statics.findByKPI_ID = function (kpiId) {
  const KPIValue = this;

  return KPIValue.find({
    'KPI_ID': kpiId,
    'deleted_At': null
  });
};

KPIValueSchema.statics.findByIDPeriod = function (id, period) {
  const KPIValue = this;

  return KPIValue.findOne({
    'KPI_ID': id,
    'Period': period,
    'deleted_At': null
  });
};

KPIValueSchema.statics.getAll = function () {
  const KPIValue = this;

  return KPIValue.find({'deleted_At': null});
};

const kpivalue = mongoose.model('kpivalue', KPIValueSchema);

module.exports = {kpivalue};
