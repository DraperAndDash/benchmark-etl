const ETL = require('../etl-helpers');

// rtt Mongo Model
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var rttSchema = new mongoose.Schema({
  filename: String,
  created_At: {
    type: Date,
    required: true,
    default: Date.now
  },
  Title: String,
  Summary: String,
  Period: String,
  Source: String,
  Basis: String,
  Revised: String,
  Status: String,
  Contact: String,
  data: [{}]
});

rttSchema.statics.findByFilename = function (filename) {
  var rttLoad = this;

  return rttLoad.findOne({
    'filename': filename
  });
};

rttSchema.statics.getAll = function () {
  var rttLoad = this;

  return rttLoad.find({});
};

const mongoModel = mongoose.model('rttLoad', rttSchema);

// rtt Glob Pattern
const globPattern = [
    '../nhs_england/Admitted-Provider-*.xls',
    '../nhs_england/NonAdmitted-Provider-*.xls',
    '../nhs_england/Incomplete-Provider-*.xls'
];

// rtt regex
const regex = new RegExp(/Admitted-Provider-\w*.xls/g);

// rtt Data Process function
const processData = function (mongoDataRaw) {
    // This function takes the raw JSON and formats it for the source database
    const formattedMongoData = {};
    let metaData = mongoDataRaw[0].slice(0,11)

    metaData.forEach((d, i) => {
      if (metaData[i] && metaData[i]._no_header_at_col_1 && metaData[i]._no_header_at_col_2) {
        let newMetaDataPropertyName = metaData[i]._no_header_at_col_1.replace("'","").replace(":","");
        formattedMongoData[newMetaDataPropertyName] = metaData[i]._no_header_at_col_2;
      }
    })

    let dataMapping = mongoDataRaw[0][12];

    formattedMongoData.data = mongoDataRaw[0].slice(13);

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
      "Region Code": "Area Team Code"
    }

    formattedMongoData.data.forEach(function (obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop) && fieldRenameMap[prop]) {
          obj[fieldRenameMap[prop]] = obj[prop];
          delete obj[prop];  
        }
      }
    })

    const dataStructure = {
      'Area Team Code': undefined,
       'Provider Code': undefined,
       'Provider Name': undefined,
       'Treatment Function Code': undefined,
       'Treatment Function': undefined,
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
       'Total number of completed pathways (all)': undefined,
       'Total number of completed pathways (with a known clock start)': undefined,
      //  'Total (with a known clock start) within 18 weeks': undefined, //Field removed in 2016 files
      //  '% within 18 weeks': undefined, //Field removed in 2016 files
       'Average (median) waiting time (in weeks)': undefined,
       '95th percentile waiting time (in weeks)': undefined
    }

    formattedMongoData.data = formattedMongoData.data.filter(dataObject => {
      if (!ETL.checkDataStructure(dataObject, dataStructure)) {
        console.log('Warning! load has not met data structure requirements', 'rtt file')
      }
      return ETL.checkDataStructure(dataObject, dataStructure);
    })

    return formattedMongoData;
}

module.exports = {mongoModel, globPattern, regex, processData};
