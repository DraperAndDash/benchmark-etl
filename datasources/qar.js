const ETL = require('../etl-helpers');
const moment = require('moment');
const XLSX = require('xlsx');

// qar Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var qarSchema = new mongoose.Schema({
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

qarSchema.index({Period: 1}, {unique: true})

qarSchema.statics.findByFilename = function (filename) {
  var qarLoad = this;

  return qarLoad.findOne({
    'filename': filename
  });
};

qarSchema.statics.getAll = function () {
  var qarLoad = this;

  return qarLoad.find({});
};
//!important! the model name must match the name of the datasource suffixed by "Load"
const mongoModel = mongoose.model('qarLoad', qarSchema);

// qar Glob Pattern
const globPattern = [
    '../nhs_england/*QAR-PROV-*.xls'
];

// qar regex
const regex = new RegExp(/QAR-PROV-.*.xls/g);

// qar Data Process function
const processData = function (xlsxFile) {
    // This function takes the raw JSON and formats it for the source database
    const sheetName = "Full Extract";
    const mongoDataRaw = XLSX.utils.sheet_to_json(xlsxFile.Sheets[sheetName], {header: "A", raw: true});
    let formattedMongoData = {};
    let metaData = mongoDataRaw.slice(0,11)

    metaData.forEach((d, i) => {
      if (metaData[i] && metaData[i].B && metaData[i].C) {
        let newMetaDataPropertyName = metaData[i].B.replace("'","").replace(":","");
        formattedMongoData[newMetaDataPropertyName] = metaData[i].C;
      }
    })

    formattedMongoData.Period = moment(new Date(formattedMongoData.Period)).format("DD/MM/YYYY")

    let dataMapping = mongoDataRaw[12];

    formattedMongoData.data = mongoDataRaw.slice(13);

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
      "Org Name": "Provider",
      "Org Code": "Provider Code",
      "Region name": "Region",
      "Area Team Code": "Region Code",
      "Area Team Name": "Region"
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
      "Region Code": undefined,
      "Provider": undefined,
      "Year": undefined,
      "Period": undefined,
      "Region Code": undefined,
      "Specialty Code": undefined,
      "Specialty Name": undefined,
      "Decisions to Admit": undefined,
      "Admissions": undefined,
      "Failed to Attend": undefined,
      "Removals": undefined,
      "GP Referrals Made": undefined,
      "Other Referrals Made": undefined,
      "First Attendances Seen": undefined,
      "First Attendances DNA": undefined,
      "Subsequent Attendances Seen": undefined,
      "Subsequent Attendances DNA": undefined
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
