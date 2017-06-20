const ETL = require('../etl-helpers');
const moment = require('moment');
const XLSX = require('xlsx');

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

aaeSchema.index({Period: 1}, {unique: true})

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
//!important! the model name must match the name of the datasource suffixed by "Load"
const mongoModel = mongoose.model('aaeLoad', aaeSchema);

// aae Glob Pattern
const globPattern = [
    '../nhs_england/*-AE-by-provider-*.xls',
    '!../nhs_england/*Q*-AE-by-provider-*.xls'
];

// aae regex
const regex = new RegExp(/\w*-\w*-AE-by-provider-\w*.xls/g);

// aae Data Process function
const processData = function (xlsxFile) {
    // This function takes the raw A&E JSON and formats it for the source database
    const sheetName = xlsxFile.SheetNames[0].toString() === "A&E Data" ? "A&E Data" : "Provider Level Data"
    const mongoDataRaw = XLSX.utils.sheet_to_json(xlsxFile.Sheets[sheetName], {header: "A", raw: true})
    let formattedMongoData = {};
    let metaData = mongoDataRaw.slice(0,10)

    metaData.forEach((d, i) => {
      if (metaData[i] && metaData[i].B && metaData[i].C) {
        let newMetaDataPropertyName = metaData[i].B.replace("'","").replace(":","");
        formattedMongoData[newMetaDataPropertyName] = metaData[i].C;
      }
    })

    formattedMongoData.Period = moment(new Date(formattedMongoData.Period)).format("DD/MM/YYYY")

    let dataMapping = mongoDataRaw[11];

    dataMapping["E"] = "Attendances of " + dataMapping["E"];
    dataMapping["F"] = "Attendances of " + dataMapping["F"];
    dataMapping["G"] = "Attendances of " + dataMapping["G"];

    dataMapping["I"] = "Breaches of " + dataMapping["I"];
    dataMapping["J"] = "Breaches of " + dataMapping["J"];
    dataMapping["K"] = "Breaches of " + dataMapping["K"];

    dataMapping["S"] = "Other Emergency admissions (ie not via A&E)";

    formattedMongoData.data = mongoDataRaw.slice(12);

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
