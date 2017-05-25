const ETL = require('../etl-helpers');
const moment = require('moment');
const XLSX = require('xlsx');

// diag Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var diagSchema = new mongoose.Schema({
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

diagSchema.index({Period: 1}, {unique: true})

diagSchema.statics.findByFilename = function (filename) {
  var diagLoad = this;

  return diagLoad.findOne({
    'filename': filename
  });
};

diagSchema.statics.getAll = function () {
  var diagLoad = this;

  return diagLoad.find({});
};

const mongoModel = mongoose.model('diagLoad', diagSchema);

// diag Glob Pattern
const globPattern = [
    '../nhs_england/Monthly-Diagnostics-Provider-February-2016*.xls',
    '../nhs_england/Monthly-Diagnostics-Web-File-Provider-*.xls',
    '../nhs_england/Monthly-Diagnostics-Revisions-Web-File-Provider-*.xls',
];

// diag regex
const regex = new RegExp(/Monthly-Diagnostics-\w*-Web-File-Provider-\w*.xls/g);

// diag Data Process function
const processData = function (xlsxFile) {
    // This function takes the raw JSON and formats it for the source database
    const sheetName = "Provider"
    const mongoDataRaw = XLSX.utils.sheet_to_json(xlsxFile.Sheets[sheetName], {header: "A", raw: true})
    let formattedMongoData = {};
    let metaData = mongoDataRaw.slice(0,10)

    metaData.forEach((d, i) => {
      if (metaData[i] && metaData[i].B && metaData[i].C) {
        let newMetaDataPropertyName = metaData[i].B.replace("'","").replace(":","");
        formattedMongoData[newMetaDataPropertyName] = metaData[i].C;
      }
    })
    console.log(formattedMongoData.Period)
    
    formattedMongoData.Period = moment(new Date(formattedMongoData.Period.replace('28th ','').replace('30th ','').replace('31st ',''))).format("DD/MM/YYYY")

    console.log(formattedMongoData.Period)

    let dataMapping = mongoDataRaw[10];

    formattedMongoData.data = mongoDataRaw.slice(11);

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
        "Provider Name": "Provider",
        "SHA Name": "Regional Team Name",
        "SHA Code": "Regional Team Code",
        "Area Team Name": "Regional Team Name",
        "Area Team Code": "Regional Team Code",
        //THESE GET REMOVED
        // "example": "REMOVE_FIELD",
        "undefined": "REMOVE_FIELD",
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
        'Regional Team Code': undefined,
        'Regional Team Name': undefined,
        'Provider Code': undefined,
        'Provider': undefined,
        'Total Waiting List': undefined,
        'Number waiting 6+ Weeks': undefined,
        'Number waiting 13+ Weeks': undefined,
        'Percentage waiting 6+ weeks': undefined,
        '0 <01 weeks': undefined,
        '01 <02 weeks': undefined,
        '02 <03 weeks': undefined,
        '03 <04 weeks': undefined,
        '04 <05 weeks': undefined,
        '05 <06 weeks': undefined,
        '06 <07 weeks': undefined,
        '07 <08 weeks': undefined,
        '08 <09 weeks': undefined,
        '09 <10 weeks': undefined,
        '10 <11 weeks': undefined,
        '11 <12 weeks': undefined,
        '12 <13 weeks': undefined,
        '13+ weeks': undefined,
        'Planned tests / procedures': undefined,
        'Unscheduled tests / procedures': undefined,
        'Waiting list tests / procedures (excluding planned)': undefined
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

    formattedMongoData.dataStuctureFailCount = dataStuctureFailCount;

    // dataStuctureFail && console.log(`Warning! load has not met data structure requirements: ${dataStuctureFailCount}`,formattedMongoData.filename)

    return formattedMongoData;
}

module.exports = {mongoModel, globPattern, regex, processData};
