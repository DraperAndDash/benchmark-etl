const mongoXlsx = require('mongo-xlsx');
const {KPIValue} = require('./models/KPIValue');
const {KPI} = require('./models/KPI');
const Promise = require('bluebird');
const benchmarkAPI = require('./api/benchmarkAPI');

const port = process.env.PORT;

const loadFileToMongo = function (extractedFile, mongoModel, processFunction, datasource) {
  return benchmarkAPI.findLoadByDatasourceFilename(extractedFile)
    .then(extractedFileFound => {
        if (extractedFileFound === null) {
            return mongoXlsx.xlsx2MongoData(extractedFile, {}, function(err, mongoData) {
              const formattedMongoData = processFunction(mongoData);
              formattedMongoData.filename = extractedFile;
              return benchmarkAPI.postLoad(datasource, formattedMongoData).then(response => {
                if (response.status === 200) {
                  return console.log('load successful');
                } else {
                  return console.log('error with load'); //Add in details from response
                }
              })
            })
        }
      })
    .catch(err => {
      return console.log('Error checking if file has been loaded previously', err.message)
    })
};

// Need to test if this conversion to Array works when only uploading single objects
// If this use case ever happens...
// Maybe I should write some tests...

function saveTransformedData(transformedData) {
  if (!transformedData instanceof Array) transformedData = [transformedData]

  return Promise.all(transformedData.map((transformedDataItem, i) => {
    console.log('looping through transformedData', i)
    if (!transformedDataItem instanceof Array) transformedDataItem = [transformedDataItem]
    if (transformedDataItem) {
      return Promise.all(transformedDataItem.map(transformedDataItemElement => {
        return benchmarkAPI.postKPIValue(transformedDataItemElement).then(response => {
          if (response.status && response.status === 200) {
            return console.log('new kpi value saved', savedKPIValue.KPI_ID, savedKPIValue.Period)
          } else {
            return console.log('error within postKPIValue response', response.Error); //Add in details from response
          }
        }).catch(error => {return console.log('error with postKPIValue')})
      }))
    }
  }))
}

function filterAndTransform(loadedData, id, transformFunction) {
  if (!loadedData instanceof Array) loadedData = [loadedData]
  
  return Promise.all(loadedData.map((loadedDataItem, i) => {
    console.log('looping through loaded data', i )
    return benchmarkAPI.findKPIValuesByIDPeriodProvider(id, loadedDataItem.Period, loadedDataItem.Provider)
      .then(loadedDataItemFound => {
        if (!loadedDataItemFound.data) {
          console.log(id, loadedDataItem.Period, loadedDataItem.Provider, 'data item not found so loading')
          return Promise.resolve(transformFunction(loadedDataItem))
        } else {
          return console.log(id, loadedDataItem.Period, 'already loaded')
        }
      })
      .catch(err => {
        return console.log('Error checking KPI has been loaded for that period', err.message)
      })
  }))
}

const transformData = function (datasource, id, transformFunction, mongo) {
  return benchmarkAPI.getDatasourceLoads(datasource).then(loadedData => {
    console.log('about to filter and transform loadedData for', id, 'in', datasource)
    return filterAndTransform(loadedData, id, transformFunction)
  }).then(transformedData => {
    console.log('about to save transformed data for', id, 'in', datasource)
    return saveTransformedData(transformedData)
  })
  .catch(err => {
    console.log('Error transforming data', err.message, 'datasource:', datasource, 'KPI_ID:', id)
  })
}

module.exports = {loadFileToMongo, transformData};