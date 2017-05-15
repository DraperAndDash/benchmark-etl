const ETL = require('../etl-helpers');
const moment = require('moment');
const XLSX = require('xlsx');

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
    '../nhs_england/Dementia-Data-Collection-*.xls*',
];

// dementia regex
const regex = new RegExp(/Dementia-Data-Collection-*.xls/g);

// dementia Data Process function
const processData = function (xlsxFile) {
    // This function takes the raw JSON and formats it for the source database
    let sheetName
    let metaSheetName
    for (let i=0; i<xlsxFile.SheetNames.length; i++) {
        if (xlsxFile.SheetNames[i].toString().includes('Front')) metaSheetName = xlsxFile.SheetNames[i]
        if (!xlsxFile.SheetNames[i].toString().includes('Front') &&
            !xlsxFile.SheetNames[i].toString().includes('Macro') &&
            !xlsxFile.SheetNames[i].toString().includes('Revision') &&
            !xlsxFile.SheetNames[i].toString().includes('Trusts')
        ) sheetName = xlsxFile.SheetNames[i]
    }
    let mongoDataRaw, metaData
    try {
        mongoDataRaw = XLSX.utils.sheet_to_json(xlsxFile.Sheets[sheetName], {header: "A", raw: true})
        metaData = XLSX.utils.sheet_to_json(xlsxFile.Sheets[metaSheetName], {header: "A", raw: true})
    } catch (err) {
        return console.log('Error! xlsx.utils.sheet_to_json failed', err)
    }
    let formattedMongoData = {}

    metaData.forEach((d, i) => {
      if (metaData[i] && metaData[i].A && metaData[i].B) {
        let newMetaDataPropertyName = metaData[i].A.replace("'","").replace(":","");
        formattedMongoData[newMetaDataPropertyName] = metaData[i].B;
      }
    })
    if (formattedMongoData.Period.slice(0,1) === "Q") {
        formattedMongoData.PeriodType = 'Quarterly'
        // convert format Q2 2016/17 to a date...
        if (formattedMongoData.Period.toString().includes('Q1')) {
            formattedMongoData.Period = 'June ' + formattedMongoData.Period.slice(3,7)
        } else if (formattedMongoData.Period.toString().includes('Q2')) {
            formattedMongoData.Period = 'September ' + formattedMongoData.Period.slice(3,7)
        } else if (formattedMongoData.Period.toString().includes('Q3')) {
            formattedMongoData.Period = 'December ' + formattedMongoData.Period.slice(3,7)
        } else if (formattedMongoData.Period.toString().includes('Q4')) {
            formattedMongoData.Period = 'March 20' + formattedMongoData.Period.slice(8,10)
        } else if (formattedMongoData.Period.toString().includes('Quarter 1')) {
            formattedMongoData.Period = 'June ' + formattedMongoData.Period.slice(12,16)
        } else if (formattedMongoData.Period.toString().includes('Quarter 2')) {
            formattedMongoData.Period = 'September ' + formattedMongoData.Period.slice(12,16)
        } else if (formattedMongoData.Period.toString().includes('Quarter 3')) {
            formattedMongoData.Period = 'December ' + formattedMongoData.Period.slice(12,16)
        } else if (formattedMongoData.Period.toString().includes('Quarter 4')) {
            formattedMongoData.Period = 'March 20' + formattedMongoData.Period.slice(17,19)
        }
    }
    formattedMongoData.Period = moment(new Date(formattedMongoData.Period)).format("DD/MM/YYYY")
    
    let dataMapping
    for (let i=0; i<25; i++) {
        if (mongoDataRaw[i] && mongoDataRaw[i].A === 'Org name') {
            dataMapping = mongoDataRaw[i]
            formattedMongoData.data = mongoDataRaw.slice(i+1);
        }
    }
    const keepColumns = ['A','B','W','X','Y','Z','AA','AB','AC','AD','AE']
    if (formattedMongoData.PeriodType === 'Quarterly') {
        for (var prop in dataMapping) {
            if (dataMapping.hasOwnProperty(prop) && keepColumns.indexOf(prop) === -1) delete dataMapping[prop]
        }
    }

    formattedMongoData.data.forEach(function (obj) {
      for (var prop in obj) {
        if (formattedMongoData.PeriodType === 'Quarterly' && obj.hasOwnProperty(prop) && keepColumns.indexOf(prop) === -1) {
            delete obj[prop]
        }
        if (obj.hasOwnProperty(prop)) {
            obj[dataMapping[prop]] = obj[prop]
            delete obj[prop]
        }
      }
    })

    const fieldRenameMap = {
        //FROM  :   TO
        "Org name": "Provider",
        "Org code": "Provider Code",
        "Number of cases with diagnostic assessment ": "Number who had a diagnostic assessment",
        "Number who had a diagnostic assessment ": "Number who had a diagnostic assessment",
        "Number of cases identified": "Number to whom case finding is applied",
        "Percentage of cases identified": "Percentage to whom case finding is applied",
        "Number of cases with diagnostic assessment": "Number who had a diagnostic assessment",
        "Number of cases with positive case finding question": "Number with positive case finding question",
        "Percentage of cases with diagnostic assessment": "Percentage with a  diagnostic assessment",
        "Percentage of cases further assessed": "Percentage with a  diagnostic assessment",
        "Number of cases with positive or inconclusive diagnostic assessment": "Number with a positive or inconclusive diagnostic assessment",
        //THESE GET REMOVED
        // "example": "REMOVE_FIELD",
        //THESE GET ADDED
        "Number of cases referred": "ADD_FIELD",
        "Number with a positive or inconclusive diagnostic assessment": "ADD_FIELD",
        "Percentage of cases referred": "ADD_FIELD",
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
        'Provider Code': undefined,
        'Provider': undefined,
        'Number to whom case finding is applied': undefined,
        'Number of emergency admissions': undefined,
        'Percentage to whom case finding is applied': undefined,
        'Number who had a diagnostic assessment': undefined,
        'Number with positive case finding question': undefined,
        'Percentage with a  diagnostic assessment': undefined,
        'Number of cases referred': undefined,
        'Number with a positive or inconclusive diagnostic assessment': undefined,
        'Percentage of cases referred': undefined
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

    return formattedMongoData;
}

module.exports = {mongoModel, globPattern, regex, processData};