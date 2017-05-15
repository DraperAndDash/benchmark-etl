const ETL = require('../etl-helpers');
const moment = require('moment');
const XLSX = require('xlsx');

// ca2wwb Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var ca2wwbSchema = new mongoose.Schema({
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

ca2wwbSchema.index({Period: 1}, {unique: true})

ca2wwbSchema.statics.findByFilename = function (filename) {
  var ca2wwbLoad = this;

  return ca2wwbLoad.findOne({
    'filename': filename
  });
};

ca2wwbSchema.statics.getAll = function () {
  var ca2wwbLoad = this;

  return ca2wwbLoad.find({});
};

const mongoModel = mongoose.model('ca2wwbLoad', ca2wwbSchema);

// ca2wwb Glob Pattern
const globPattern = [
    '../nhs_england/*-CANCER-WAITING-TIMES-PROVIDER-*.xls*',
    '!../nhs_england/Q*-CANCER-WAITING-TIMES-PROVIDER-*.xls*',
];

// ca2wwb regex
const regex = new RegExp(/\w*-CANCER-WAITING-TIMES-PROVIDER-\w*.xls\w*/g);

// ca2wwb Data Process function
const processData = function (xlsxFile) {
    // This function takes the raw JSON and formats it for the source database
    const sheetName = "TWO WEEK WAIT-BREAST SYMPTOMS"
    const mongoDataRaw = XLSX.utils.sheet_to_json(xlsxFile.Sheets[sheetName], {header: "A", raw: true})
    const metaData = XLSX.utils.sheet_to_json(xlsxFile.Sheets["Frontpage"], {header: "A", raw: true})
    let formattedMongoData = {};
    formattedMongoData.Period = moment(ETL.convertGregorianDateToUnix(parseInt(metaData[1].A))).format("DD/MM/YYYY")
    formattedMongoData.Summary = metaData[0].A
    formattedMongoData.Contact = metaData[metaData.length - 1].A
    
    let dataMapping = mongoDataRaw[6];

    formattedMongoData.data = mongoDataRaw.slice(7);

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
      "ODS CODE (3)": "Provider Code",
      " AFTER 14 DAYS": "AFTER 14 DAYS",
      "undefined": "SEEN WITHIN 14 DAYS",
      "REFERRAL REASON (4)": "REFERRAL REASON",
      "REFERRAL REASON (2)": "REFERRAL REASON",
      //THESE GET REMOVED
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
      'REFERRAL REASON': undefined,
      'TOTAL': undefined,
      'WITHIN 14 DAYS': undefined,
      'AFTER 14 DAYS': undefined,
      'SEEN WITHIN 14 DAYS': undefined,
      'WITHIN 14 DAYS': undefined,
      '15 TO 16 DAYS': undefined,
      '17 TO 21 DAYS': undefined,
      '22 TO 28 DAYS': undefined,
      'AFTER 28 DAYS': undefined
    }

    let dataStuctureFail = false;
    let dataStuctureFailCount = 0;

    formattedMongoData.data = formattedMongoData.data.filter(dataObject => {
      if (!ETL.checkDataStructure(dataObject, dataStructure)) {
        dataStuctureFail = true;
        dataStuctureFailCount += 1;
      }
      return ETL.checkDataStructure(dataObject, dataStructure);
    })

    dataStuctureFail && console.log(`Warning! load has not met data structure requirements: ${dataStuctureFailCount}`,formattedMongoData.filename)

    return formattedMongoData;
}

module.exports = {mongoModel, globPattern, regex, processData};
