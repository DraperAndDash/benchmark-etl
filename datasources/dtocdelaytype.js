const ETL = require('../etl-helpers');
const moment = require('moment');

// dtocdelaytype Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var dtocdelaytypeSchema = new mongoose.Schema({
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

dtocdelaytypeSchema.index({Period: 1}, {unique: true})

dtocdelaytypeSchema.statics.findByFilename = function (filename) {
  var dtocdelaytypeLoad = this;

  return dtocdelaytypeLoad.findOne({
    'filename': filename
  });
};

dtocdelaytypeSchema.statics.getAll = function () {
  var dtocdelaytypeLoad = this;

  return dtocdelaytypeLoad.find({});
};

const mongoModel = mongoose.model('dtocdelaytypeLoad', dtocdelaytypeSchema);

// dtocdelaytype Glob Pattern
const globPattern = [
    '../nhs_england/Trust-Type-B-*.xls',
];

// dtocdelaytype regex
const regex = new RegExp(/Trust-Type-B-\w*-\w*-\w*.xls/g);

// dtocdelaytype Data Process function
const processData = function (mongoDataRaw) {
    let sheetNumber = 1;
    // This function takes the raw JSON and formats it for the source database
    let formattedMongoData = {};
    const metaData = mongoDataRaw[sheetNumber].slice(0,11);

    metaData.forEach((d, i) => {
        if (metaData[i] && metaData[i]._no_header_at_col_1 && metaData[i]._no_header_at_col_2) {
            let newMetaDataPropertyName = metaData[i]._no_header_at_col_1.replace("'","").replace(":","");
            formattedMongoData[newMetaDataPropertyName] = metaData[i]._no_header_at_col_2;
        }
    })

    formattedMongoData.Period = moment(new Date(formattedMongoData.Period)).format("DD/MM/YYYY")
    
    let dataMapping = mongoDataRaw[sheetNumber][12];

    formattedMongoData.data = mongoDataRaw[sheetNumber].slice(13);

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
        "Name": "Provider",
        "Code": "Provider Code",
        "SHA Code": "Region",
        "SHA": "Region",
        "Area Team Code": "Region",
        "Area Team": "Region",
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
        'Acute': undefined,
        'Non-Acute': undefined,
        'Total': undefined,
    }

    formattedMongoData.data = formattedMongoData.data.filter(dataObject => {
    if (dataObject.Provider) {
        if (!ETL.checkDataStructure(dataObject, dataStructure)) {
            console.log('Warning! load has not met data structure requirements', dataObject, dataStructure)
        }
        return ETL.checkDataStructure(dataObject, dataStructure)
    }

    })

    return formattedMongoData;
}

module.exports = {mongoModel, globPattern, regex, processData};