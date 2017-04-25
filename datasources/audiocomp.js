const ETL = require('../etl-helpers');
const moment = require('moment');

// audiocomp Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var audiocompSchema = new mongoose.Schema({
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

audiocompSchema.index({Period: 1}, {unique: true})

audiocompSchema.statics.findByFilename = function (filename) {
  var audiocompLoad = this;

  return audiocompLoad.findOne({
    'filename': filename
  });
};

audiocompSchema.statics.getAll = function () {
  var audiocompLoad = this;

  return audiocompLoad.find({});
};

const mongoModel = mongoose.model('audiocompLoad', audiocompSchema);

// audiocomp Glob Pattern
const globPattern = [
    '../nhs_england/*Completed-Pathways-Provider-View*.xls',
    '../nhs_england/*Completed-Pathways-Commissioner-Provider-View*.xls',
    '!../nhs_england/*-0809-*.xls',
    '!../nhs_england/*-0910-*.xls',
    '!../nhs_england/*-1011-*.xls',
];

// audiocomp regex
const regex = new RegExp(/Monthly-Diagnostics-\w*-Web-File-Provider-\w*.xls/g);

// audiocomp Data Process function
const processData = function (mongoDataRaw) {
    let sheetNumber = 2;
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
    
    // December 2016 file has the Provider sheet in a different location than all other files
    if (formattedMongoData.Period === "01/12/2016") { sheetNumber = 1 }

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
        "Code": "Provider Code",
        "SHA Code": "Region Code",
        "SHA": "Region Code",
        "Area Team Code": "Region Code",
        "Area Team": "Region Code",
        //THESE GET REMOVED
        "% within 18 weeks": "REMOVE_FIELD",
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
        'Region Code': undefined,
        'Provider Code': undefined,
        'Provider': undefined,
        '>0-1': undefined,
        '>1-2': undefined,
        '>2-3': undefined,
        '>3-4': undefined,
        '>4-5': undefined,
        '>5-6': undefined,
        '>6-7': undefined,
        '>7-8': undefined,
        '>8-9': undefined,
        '>9-10': undefined,
        '>10-11': undefined,
        '>11-12': undefined,
        '>12-13': undefined,
        '>13-14': undefined,
        '>14-15': undefined,
        '>15-16': undefined,
        '>16-17': undefined,
        '>17-18': undefined,
        '>18-19': undefined,
        '>19-20': undefined,
        '>20-21': undefined,
        '>21-22': undefined,
        '>22-23': undefined,
        '>23-24': undefined,
        '>24-25': undefined,
        '>25-26': undefined,
        '>26-27': undefined,
        '>27-28': undefined,
        '>28-29': undefined,
        '>29-30': undefined,
        '>30-31': undefined,
        '>31-32': undefined,
        '>32-33': undefined,
        '>33-34': undefined,
        '>34-35': undefined,
        '>35-36': undefined,
        '>36-37': undefined,
        '>37-38': undefined,
        '>38-39': undefined,
        '>39-40': undefined,
        '>40-41': undefined,
        '>41-42': undefined,
        '>42-43': undefined,
        '>43-44': undefined,
        '>44-45': undefined,
        '>45-46': undefined,
        '>46-47': undefined,
        '>47-48': undefined,
        '>48-49': undefined,
        '>49-50': undefined,
        '>50-51': undefined,
        '>51-52': undefined,
        '52 plus': undefined,
        'Patients with unknown clock start date': undefined,
        'Total (all)': undefined,
        'Total (known clock start)': undefined,
        'Average (median) waiting time (in weeks)': undefined,
        '95th percentile waiting time (in weeks)': undefined
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