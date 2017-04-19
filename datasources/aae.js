const ETL = require('../etl-helpers');
const moment = require('moment');

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
    '../nhs_england/*-AE-by-provider-*.xls',
    '!../nhs_england/*Q*-AE-by-provider-*.xls'
];

// aae regex
const regex = new RegExp(/\w*-\w*-AE-by-provider-\w*.xls/g);

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

    formattedMongoData.Period = moment(new Date(formattedMongoData.Period)).format("DD/MM/YYYY")

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

    const fieldRenameMap = {
      //FROM  :   //TO
      "Name": "Provider",
      "Code": "Provider Code"
      //THESE GET REMOVED
      // "example": "REMOVE_FIELD",
      //THESE GET ADDED
      // 'example': "ADD_FIELD",
    }

    formattedMongoData.data.forEach((obj) => {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop) && fieldRenameMap[prop] && fieldRenameMap[prop] !== "ADD_FIELD") {
          obj[fieldRenameMap[prop]] = obj[prop];
          delete obj[prop];
          delete obj["REMOVE_FIELD"];
        }
      }
      for (var prop in fieldRenameMap) {
        if (fieldRenameMap[prop] === "ADD_FIELD" && !obj.hasOwnProperty(prop)) {
          obj[prop] = '-';
        }
      }
    })

    const dataStructure = {
      "Provider Code": undefined,
      "Region": undefined,
      "Provider": undefined,
      "Attendances of Type 1 Departments - Major A&E": undefined,
      "Attendances of Type 2 Departments - Single Specialty": undefined,
      "Attendances of Type 3 Departments - Other A&E/Minor Injury Unit": undefined,
      "Total attendances": undefined,
      "Breaches of Type 1 Departments - Major A&E": undefined,
      "Breaches of Type 2 Departments - Single Specialty": undefined,
      "Breaches of Type 3 Departments - Other A&E/Minor Injury Unit": undefined,
      "Total Attendances > 4 hours": undefined,
      "Percentage in 4 hours or less (type 1)": undefined,
      "Percentage in 4 hours or less (all)": undefined,
      "Emergency Admissions via Type 1 A&E": undefined,
      "Emergency Admissions via Type 2 A&E": undefined,
      "Emergency Admissions via Type 3 and 4 A&E": undefined,
      "Total Emergency Admissions via A&E": undefined,
      "Other Emergency admissions (ie not via A&E)": undefined,
      "Total Emergency Admissions": undefined,
      "Number of patients spending >4 hours from decision to admit to admission": undefined,
      "Number of patients spending >12 hours from decision to admit to admission": undefined
    }

    formattedMongoData.data = formattedMongoData.data.filter(dataObject => {
      // if (!ETL.checkDataStructure(dataObject, dataStructure)) {
      //   console.log('Warning! load has not met data structure requirements',dataObject,dataStructure)
      // }
      return ETL.checkDataStructure(dataObject, dataStructure);
    })

    return formattedMongoData;
}

module.exports = {mongoModel, globPattern, regex, processData};
