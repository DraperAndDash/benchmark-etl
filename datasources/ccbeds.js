const ETL = require('../etl-helpers');
const moment = require('moment');

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
const processData = function (mongoDataRaw) {
    // This function takes the raw JSON and formats it for the source database
    let formattedMongoData = {};
    const metaData = mongoDataRaw[0].slice(1,12);

    metaData.forEach((d, i) => {
        if (metaData[i] && metaData[i]._no_header_at_col_1 && metaData[i]._no_header_at_col_2) {
            let newMetaDataPropertyName = metaData[i]._no_header_at_col_1.replace("'","").replace(":","");
            formattedMongoData[newMetaDataPropertyName] = metaData[i]._no_header_at_col_2;
        }
    })

    formattedMongoData.Period = moment(new Date(formattedMongoData.Period)).format("DD/MM/YYYY")

    let dataMapping = mongoDataRaw[0][13];

    dataMapping["_no_header_at_col_5"] = "Open - " + dataMapping["_no_header_at_col_5"];
    dataMapping["_no_header_at_col_6"] = "Open - " + dataMapping["_no_header_at_col_6"];
    dataMapping["_no_header_at_col_7"] = "Open - " + dataMapping["_no_header_at_col_7"];

    dataMapping["_no_header_at_col_8"] = "Occupied - " + dataMapping["_no_header_at_col_8"];
    dataMapping["_no_header_at_col_9"] = "Occupied - " + dataMapping["_no_header_at_col_9"];
    dataMapping["_no_header_at_col_10"] = "Occupied - " + dataMapping["_no_header_at_col_10"];

    dataMapping["_no_header_at_col_12"] = "% of Open Beds Occupied - " + dataMapping["_no_header_at_col_12"];
    dataMapping["_no_header_at_col_13"] = "% of Open Beds Occupied - " + dataMapping["_no_header_at_col_13"];
    dataMapping["_no_header_at_col_14"] = "% of Open Beds Occupied - " + dataMapping["_no_header_at_col_14"];

    formattedMongoData.data = mongoDataRaw[0].slice(14);

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
