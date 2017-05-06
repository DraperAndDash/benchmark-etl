const ETL = require('../etl-helpers');
const moment = require('moment');

// dementia Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var dementiaSchema = new mongoose.Schema({
  filename: String,
  created_At: {
    type: Date,
    required: true,
    default: Date.now
  },
  Summary: String,
  Period: String,
  Source: String,
  Published: String,
  data: [{}]
});

dementiaSchema.index({Period: 1}, {unique: true})

dementiaSchema.statics.findByFilename = function (filename) {
  var dementiaLoad = this;

  return dementiaLoad.findOne({
    'filename': filename
  });
};

dementiaSchema.statics.getAll = function () {
  var dementiaLoad = this;

  return dementiaLoad.find({});
};

const mongoModel = mongoose.model('dementiaLoad', dementiaSchema);

// dementia Glob Pattern
const globPattern = [
    '../nhs_england/Dementia-Data-Collection-*.xls',
];

// dementia regex
const regex = new RegExp(/Dementia-Data-Collection-*.xls/g);

// dementia Data Process function
const processData = function (mongoDataRaw) {
    let sheetNumber = mongoDataRaw.length - 1;
    // This function takes the raw JSON and formats it for the source database
    let formattedMongoData = {};
    const metaData = mongoDataRaw[0].slice(0,16);

    metaData.forEach((d, i) => {
        if (metaData[i] && metaData[i]._no_header_at_col_1 && metaData[i]._no_header_at_col_2) {
            let newMetaDataPropertyName = metaData[i]._no_header_at_col_1.replace("'","").replace(":","");
            formattedMongoData[newMetaDataPropertyName] = metaData[i]._no_header_at_col_2;
        }
    })

    if (formattedMongoData.Period.substring(0,1) === "Q") {
        console.log(formattedMongoData.Title, 'is a quarter file')
    }

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