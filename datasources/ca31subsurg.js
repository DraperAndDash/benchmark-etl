const ETL = require('../etl-helpers');
const moment = require('moment');

// ca31subsurg Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var ca31subsurgSchema = new mongoose.Schema({
  filename: String,
  created_At: {
    type: Date,
    required: true,
    default: Date.now
  },
  Summary: String,
  Period: String,
  Contact: String,
  data: [{}]
});

ca31subsurgSchema.statics.findByFilename = function (filename) {
  var ca31subsurgLoad = this;

  return ca31subsurgLoad.findOne({
    'filename': filename
  });
};

ca31subsurgSchema.statics.getAll = function () {
  var ca31subsurgLoad = this;

  return ca31subsurgLoad.find({});
};

const mongoModel = mongoose.model('ca31subsurgLoad', ca31subsurgSchema);

// ca31subsurg Glob Pattern
const globPattern = [
    '../nhs_england/*-CANCER-WAITING-TIMES-PROVIDER-*.xls*',
    '!../nhs_england/Q*-CANCER-WAITING-TIMES-PROVIDER-*.xls*',
    '!../nhs_england/OCTOBER-2015-CANCER-WAITING-TIMES-PROVIDER-WORKBOOK-FINAL1.xlsx'
];

// ca31subsurg regex
const regex = new RegExp(/\w*-CANCER-WAITING-TIMES-PROVIDER-\w*.xls\w*/g);

// ca31subsurg Data Process function
const processData = function (mongoDataRaw) {
    // This function takes the raw JSON and formats it for the source database
    let formattedMongoData = {};
    formattedMongoData.Period = moment(ETL.convertGregorianDateToUnix(parseInt(mongoDataRaw[0][0]['Cancer Waiting Times statistics']))).format("DD/MM/YYYY")
    for (var prop in mongoDataRaw[9][1]) {
        formattedMongoData.Summary = prop;
    }
    formattedMongoData.Contact = mongoDataRaw[0][mongoDataRaw[0].length - 1]['Cancer Waiting Times statistics']
    
    let dataMapping = mongoDataRaw[9][8];

    formattedMongoData.data = mongoDataRaw[9].slice(9);

    formattedMongoData.data.forEach(function (obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          obj[dataMapping[prop]] = obj[prop];
          delete obj[prop];
        }
      }
    })

    const fieldRenameMap = {
      //FROM  :   TO
      "PROVIDER (4) (5)": "Provider",
      "PROVIDER": "Provider",
      "ODS CODE (1)": "Provider Code",
      "ODS CODE (2)": "Provider Code",
      "ODS CODE (3)": "Provider Code",
      "CARE SETTING (1)": "CARE SETTING",
      "CARE SETTING (2)": "CARE SETTING",
      "CARE SETTING (3)": "CARE SETTING",
      "TREATMENT TYPE (3)": "TREATMENT TYPE",
      "TREATMENT TYPE (4)": "TREATMENT TYPE",
      "TREATMENT TYPE (5)": "TREATMENT TYPE",
      "undefined": "TREATED WITHIN 31 DAYS",
      //THESE GET REMOVED
      "ONS AREA ID (1)": "REMOVE_FIELD",
      "ONS AREA ID (2)": "REMOVE_FIELD",
      //THESE GET ADDED
      "Provider Code": "ADD_FIELD",
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
      'Provider Code': undefined,
      'Provider': undefined,
      'CARE SETTING': undefined,
      'TREATMENT TYPE': undefined,
      'TOTAL': undefined,
      'WITHIN 31 DAYS': undefined,
      'AFTER 31 DAYS': undefined,
      'TREATED WITHIN 31 DAYS': undefined,
      'WITHIN 31 DAYS': undefined,
      '32 TO 38 DAYS': undefined,
      '39 TO 48 DAYS': undefined,
      '49 TO 62 DAYS': undefined,
      'AFTER 62 DAYS': undefined,
    }

    formattedMongoData.data = formattedMongoData.data.filter(dataObject => {
      if (dataObject.Provider) {
        if (dataObject.Provider === "INDEPENDENT ORGANISATION") {
          dataObject.Provider = dataObject["Provider Code"] + "-" + dataObject.Provider;
        }
        if (!ETL.checkDataStructure(dataObject, dataStructure)) {
          console.log('Warning! load has not met data structure requirements',dataObject,dataStructure)
        }
        return ETL.checkDataStructure(dataObject, dataStructure)  && dataObject["CARE SETTING"] === "ALL CARE"
      }

    })

    return formattedMongoData;
}

module.exports = {mongoModel, globPattern, regex, processData};
