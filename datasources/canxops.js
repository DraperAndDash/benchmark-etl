const ETL = require('../etl-helpers');
const moment = require('moment');

// canxops Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var canxopsSchema = new mongoose.Schema({
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

canxopsSchema.statics.findByFilename = function (filename) {
  var canxopsLoad = this;

  return canxopsLoad.findOne({
    'filename': filename
  });
};

canxopsSchema.statics.getAll = function () {
  var canxopsLoad = this;

  return canxopsLoad.find({});
};

const mongoModel = mongoose.model('canxopsLoad', canxopsSchema);

// canxops Glob Pattern
const globPattern = [
    '../nhs_england/MSitRep-*.xls',
    '!../nhs_england/MSitRep-Timeseries*.xls'
];

// canxops regex
const regex = new RegExp(/MSitRep-[^T]\w*-\d*-\w*.xls/g);

// canxops Data Process function
const processData = function (mongoDataRaw) {
    // This function takes the raw JSON and formats it for the source database
    let formattedMongoData = {};
    const metaData = mongoDataRaw[1].slice(1,12);

    metaData.forEach((d, i) => {
        if (metaData[i] && metaData[i]._no_header_at_col_1 && metaData[i]._no_header_at_col_2) {
            let newMetaDataPropertyName = metaData[i]._no_header_at_col_1.replace("'","").replace(":","");
            formattedMongoData[newMetaDataPropertyName] = metaData[i]._no_header_at_col_2;
        }
    })

    formattedMongoData.Period = moment(new Date(formattedMongoData.Period)).format("DD/MM/YYYY")

    let dataMapping = mongoDataRaw[1][13];

    formattedMongoData.data = mongoDataRaw[1].slice(14);

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
        'Urgent Operations Cancelled': undefined,
        'Urgent Operations Cancelled for the 2nd or more time': undefined
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
