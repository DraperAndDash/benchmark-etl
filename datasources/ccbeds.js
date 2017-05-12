const ETL = require('../etl-helpers');
const moment = require('moment');
const XLSX = require('xlsx');

// ccbeds Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var ccbedsSchema = new mongoose.Schema({
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

ccbedsSchema.index({Period: 1}, {unique: true})

ccbedsSchema.statics.findByFilename = function (filename) {
  var ccbedsLoad = this;

  return ccbedsLoad.findOne({
    'filename': filename
  });
};

ccbedsSchema.statics.getAll = function () {
  var ccbedsLoad = this;

  return ccbedsLoad.find({});
};

const mongoModel = mongoose.model('ccbedsLoad', ccbedsSchema);

// ccbeds Glob Pattern
const globPattern = [
    '../nhs_england/MSitRep-*.xls',
    '!../nhs_england/MSitRep-Timeseries*.xls'
];

// ccbeds regex
const regex = new RegExp(/MSitRep-[^T]\w*-\d*-\w*.xls/g);

// ccbeds Data Process function
const processData = function (xlsxFile) {
    // This function takes the raw JSON and formats it for the source database
    const sheetName = "Critical Care Beds"
    const mongoDataRaw = XLSX.utils.sheet_to_json(xlsxFile.Sheets[sheetName], {header: "A", raw: true})
    let formattedMongoData = {};
    let metaData = mongoDataRaw.slice(1,12)

    metaData.forEach((d, i) => {
      if (metaData[i] && metaData[i].B && metaData[i].C) {
        let newMetaDataPropertyName = metaData[i].B.replace("'","").replace(":","");
        formattedMongoData[newMetaDataPropertyName] = metaData[i].C;
      }
    })

    formattedMongoData.Period = moment(new Date(formattedMongoData.Period)).format("DD/MM/YYYY")

    let dataMapping = mongoDataRaw[11];

    dataMapping["F"] = "Open - " + dataMapping["F"];
    dataMapping["G"] = "Open - " + dataMapping["G"];
    dataMapping["H"] = "Open - " + dataMapping["H"];

    dataMapping["I"] = "Occupied - " + dataMapping["I"];
    dataMapping["J"] = "Occupied - " + dataMapping["J"];
    dataMapping["K"] = "Occupied - " + dataMapping["K"];

    dataMapping["M"] = "% of Open Beds Occupied - " + dataMapping["M"];
    dataMapping["N"] = "% of Open Beds Occupied - " + dataMapping["N"];
    dataMapping["O"] = "% of Open Beds Occupied - " + dataMapping["O"];

    formattedMongoData.data = mongoDataRaw.slice(12);

    formattedMongoData.data.forEach(function (obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          obj[dataMapping[prop]] = obj[prop]
          delete obj[prop];
        }
      }
    })

    const fieldRenameMap = {
        //FROM  :   TO
        "Name": "Provider",
        "Code": "Provider Code",
        "DCO Team": "Region",
        "Area Team": "Region",
        "SHA": "Region",
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
        'Open - Number of Adult critical care beds': undefined,
        'Open - Number of Paediatric intensive care beds': undefined,
        'Open - Number of Neonatal critical care cots (or beds)': undefined,
        'Occupied - Number of Adult critical care beds': undefined,
        'Occupied - Number of Paediatric intensive care beds': undefined,
        'Occupied - Number of Neonatal critical care cots (or beds)': undefined,
        '% of Open Beds Occupied - Adult critical care beds': undefined,
        '% of Open Beds Occupied - Paediatric intensive care beds': undefined,
        '% of Open Beds Occupied - Neonatal critical care cots (or beds)': undefined,
        'Number of Non-medical Critical care transfers': undefined
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
