const ETL = require('../etl-helpers');
const moment = require('moment');
const XLSX = require('xlsx');

// dtocdelayreason Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var dtocdelayreasonSchema = new mongoose.Schema({
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
  Published: String,
  Revised: String,
  Status: String,
  Contact: String,
  data: [{}]
});

dtocdelayreasonSchema.index({Period: 1}, {unique: true})

dtocdelayreasonSchema.statics.findByFilename = function (filename) {
  var dtocdelayreasonLoad = this;

  return dtocdelayreasonLoad.findOne({
    'filename': filename
  });
};

dtocdelayreasonSchema.statics.getAll = function () {
  var dtocdelayreasonLoad = this;

  return dtocdelayreasonLoad.find({});
};

const mongoModel = mongoose.model('dtocdelayreasonLoad', dtocdelayreasonSchema);

// dtocdelayreason Glob Pattern
const globPattern = [
    '../nhs_england/Trust-Type-B-*.xls',
];

// dtocdelayreason regex
const regex = new RegExp(/Trust-Type-B-.*\.xls/g);

// dtocdelayreason Data Process function
const processData = function (xlsxFile) {
    // This function takes the raw JSON and formats it for the source database
    const sheetName = "Trust - by reason"
    const mongoDataRaw = XLSX.utils.sheet_to_json(xlsxFile.Sheets[sheetName], {header: "A", raw: true})
    let formattedMongoData = {};
    let metaData = mongoDataRaw.slice(1,9)

    metaData.forEach((d, i) => {
      if (metaData[i] && metaData[i].B && metaData[i].C) {
        let newMetaDataPropertyName = metaData[i].B.replace("'","").replace(":","");
        formattedMongoData[newMetaDataPropertyName] = metaData[i].C;
      }
    })

    formattedMongoData.Period = moment(new Date(formattedMongoData.Period)).format("DD/MM/YYYY")

    let dataMapping = mongoDataRaw[9];

    formattedMongoData.data = mongoDataRaw.slice(10);

    formattedMongoData.data.forEach(function (obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          obj[dataMapping[prop]] = obj[prop].toString().trim();
          delete obj[prop];
        }
      }
    })

    const fieldRenameMap = {
        //FROM  :   TO
        "Name": "Provider",
        "Code": "Provider Code",
        "SHA Code": "Region",
        "SHA": "Region",
        "Area Team Code": "Region",
        "Area Team": "Region",
        "Area Team ": "Region",
        //THESE GET REMOVED
        // "example": "REMOVE_FIELD",
        //THESE GET ADDED
        // "example": "ADD_FIELD",
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
        'Region': undefined,
        'Provider Code': undefined,
        'Provider': undefined,
        'A) Completion of Assessment': undefined,
        'B) Public Funding': undefined,
        'C) Waiting Further NHS Non-Acute Care': undefined,
        'DI) Awaiting Residential Home Placement or Availability': undefined,
        'DII) Awaiting Nursing Home Placement or Availability': undefined,
        'E) Awaiting Care Package in Own Home': undefined,
        'F) Awaiting Community Equipment and Adaptions': undefined,
        'G) Patient or Family Choice': undefined,
        'H) Disputes': undefined,
        'I) Housing - Patients Not Covered by NHS and Community Care Act': undefined,
        'Total': undefined,
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