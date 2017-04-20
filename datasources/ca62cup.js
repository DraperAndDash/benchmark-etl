const ETL = require('../etl-helpers');
const moment = require('moment');

// ca62cup Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var ca62cupSchema = new mongoose.Schema({
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

ca62cupSchema.index({Period: 1}, {unique: true})

ca62cupSchema.statics.findByFilename = function (filename) {
  var ca62cupLoad = this;

  return ca62cupLoad.findOne({
    'filename': filename
  });
};

ca62cupSchema.statics.getAll = function () {
  var ca62cupLoad = this;

  return ca62cupLoad.find({});
};

const mongoModel = mongoose.model('ca62cupLoad', ca62cupSchema);

// ca62cup Glob Pattern
const globPattern = [
    '../nhs_england/*-CANCER-WAITING-TIMES-PROVIDER-*.xls*',
    '!../nhs_england/Q*-CANCER-WAITING-TIMES-PROVIDER-*.xls*',
    '!../nhs_england/OCTOBER-2015-CANCER-WAITING-TIMES-PROVIDER-WORKBOOK-FINAL1.xlsx'
];

// ca62cup regex
const regex = new RegExp(/\w*-CANCER-WAITING-TIMES-PROVIDER-\w*.xls\w*/g);

// ca62cup Data Process function
const processData = function (mongoDataRaw) {
    // This function takes the raw JSON and formats it for the source database
    let formattedMongoData = {};
    formattedMongoData.Period = moment(ETL.convertGregorianDateToUnix(parseInt(mongoDataRaw[0][0]['Cancer Waiting Times statistics']))).format("DD/MM/YYYY")
    for (var prop in mongoDataRaw[12][1]) {
        formattedMongoData.Summary = prop;
    }
    formattedMongoData.Contact = mongoDataRaw[0][mongoDataRaw[0].length - 1]['Cancer Waiting Times statistics']
    
    let dataMapping = mongoDataRaw[12][7];

    formattedMongoData.data = mongoDataRaw[12].slice(8);

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
      "ACCOUNTABLE PROVIDER (4) (5)": "Provider",
      "ACCOUNTABLE PROVIDER": "Provider",
      "ODS CODE (1)": "Provider Code",
      "ODS CODE (2)": "Provider Code",
      "ODS CODE (3)": "Provider Code",
      "CARE SETTING (1)": "CARE SETTING",
      "CARE SETTING (2)": "CARE SETTING",
      "CARE SETTING (3)": "CARE SETTING",
      "CANCER TYPE (3)": "CANCER TYPE",
      "CANCER TYPE (4)": "CANCER TYPE",
      "CANCER TYPE(4)": "CANCER TYPE",
      "91 TO 104 DAYS ": "91 TO 104 DAYS",
      "undefined": "TREATED WITHIN 62 DAYS",
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
      'CANCER TYPE': undefined,
      'TOTAL': undefined,
      'WITHIN 62 DAYS': undefined,
      'AFTER 62 DAYS': undefined,
      'TREATED WITHIN 62 DAYS': undefined,
      'WITHIN 31 DAYS': undefined,
      '32 TO 38 DAYS': undefined,
      '39 TO 48 DAYS': undefined,
      '49 TO 62 DAYS': undefined,
      '63 TO 76 DAYS': undefined,
      '77 TO 90 DAYS': undefined,
      '91 TO 104 DAYS': undefined,
      'AFTER 104 DAYS': undefined,
    }

    formattedMongoData.data = formattedMongoData.data.filter(dataObject => {
      if (dataObject.Provider) {
        if (!ETL.checkDataStructure(dataObject, dataStructure)) {
          console.log('Warning! load has not met data structure requirements', dataObject, dataStructure)
        }
        return ETL.checkDataStructure(dataObject, dataStructure) && dataObject["CARE SETTING"] === "ALL CARE"
      }

    })

    return formattedMongoData;
}

module.exports = {mongoModel, globPattern, regex, processData};
