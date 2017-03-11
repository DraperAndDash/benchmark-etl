// aae Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var aaeSchema = new mongoose.Schema({
  filename: String,
  created_At: {
    type: Date,
    required: true,
    default: Date.now
  },
  Summary: String,
  Period: String,
  Source: String,
  Basis: String,
  Revised: String,
  Status: String,
  Contact: String,
  data: [{}]
});

aaeSchema.statics.findByFilename = function (filename) {
  var aaeLoad = this;

  return aaeLoad.findOne({
    'filename': filename
  });
};

aaeSchema.statics.getAll = function () {
  var aaeLoad = this;

  return aaeLoad.find({});
};

const mongoModel = mongoose.model('aaeLoad', aaeSchema);

// aae Glob Pattern
const globPattern = [
    '../scraped-data/**/*-AE-by-provider-*.xls',
    '!../scraped-data/**/*Q*-AE-by-provider-*.xls'
];

// aae Data Process function
const processData = function (mongoDataRaw) {
    // This function takes the raw A&E JSON and formats it for the source database
    const formattedMongoData = {};
    const metaData = mongoDataRaw.slice(0,11);

    metaData.forEach((d, i) => {
      if (metaData[i] && metaData[i]._no_header_at_col_1 && metaData[i]._no_header_at_col_2) {
        let newMetaDataPropertyName = metaData[i]._no_header_at_col_1.replace("'","").replace(":","");
        formattedMongoData[newMetaDataPropertyName] = metaData[i]._no_header_at_col_2;
      }
    })

    let dataMapping = mongoDataRaw[14];

    dataMapping["_no_header_at_col_4"] = "Attendances of " + dataMapping["_no_header_at_col_4"];
    dataMapping["_no_header_at_col_5"] = "Attendances of " + dataMapping["_no_header_at_col_5"];
    dataMapping["_no_header_at_col_6"] = "Attendances of " + dataMapping["_no_header_at_col_6"];

    dataMapping["_no_header_at_col_8"] = "Breaches of " + dataMapping["_no_header_at_col_8"];
    dataMapping["_no_header_at_col_9"] = "Breaches of " + dataMapping["_no_header_at_col_9"];
    dataMapping["_no_header_at_col_10"] = "Breaches of " + dataMapping["_no_header_at_col_10"];

    dataMapping["_no_header_at_col_18"] = "Other Emergency admissions (ie not via A&E)";

    formattedMongoData.data = mongoDataRaw.slice(15);

    formattedMongoData.data.forEach(function (obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          obj[dataMapping[prop]] = obj[prop];
          delete obj[prop];
        }
      }
    })

    return formattedMongoData;
}

module.exports = {mongoModel, globPattern, processData};
