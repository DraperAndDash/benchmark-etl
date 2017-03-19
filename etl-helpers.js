const mongoXlsx = require('mongo-xlsx');
const Promise = require('bluebird');
const benchmarkAPI = require('./api/benchmark-api');

const port = process.env.PORT;

const checkDataStructure = function(...objects) {
  const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
  const union = new Set(allKeys);
  return objects.every(object => union.size === Object.keys(object).length);
}

const kpiValueStructure = {
  "KPI_ID" : undefined,
  "Period" : undefined,
  "Provider" : undefined,
  "Value" : undefined,
  "created_From" : undefined
}

const loadFileToMongo = function (extractedFile, mongoModel, processFunction, datasource) {
  return benchmarkAPI.findLoadByDatasourceFilename(datasource, extractedFile)
    .then(extractedFileFound => {
        if (extractedFileFound.data.loads.length === 0) {
            console.log(extractedFile, 'not found, loading into', mongoModel.modelName,'...')
            return mongoXlsx.xlsx2MongoData(extractedFile, {}, function(err, mongoData) {
              const formattedMongoData = processFunction(mongoData);
              formattedMongoData.filename = extractedFile;
              return benchmarkAPI.postLoad(datasource, formattedMongoData).then(response => {
                if (response.status === 200) {
                  // return console.log(response.data.filename, 'loaded into', response.data._id)
                  return {message: `${response.data.filename} + 'loaded into' ${response.data._id}`}
                } else {
                  // return console.log(response.status, 'Error loading', extractedFile); //Add in details from response
                  return {message: `${response.status} + 'Error loading' + ${extractedFile}`}
                }
              })
            })
        } else {
          console.log('Warning!', extractedFile, 'already loaded into', mongoModel.modelName)
        }
      })
    .catch(err => {
      return console.log('Error checking if file has been loaded previously', err.message)
    })
}

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
        if (transformedDataItemElement && checkDataStructure(transformedDataItemElement, kpiValueStructure)) {
          return benchmarkAPI.postKPIValue(transformedDataItemElement).then(response => {
            if (response.status && response.status === 200) {
              // return console.log('new kpi value saved in ', response.data._id)
            } else {
              return console.log('response from postKPIValue !== 200', response); //Add in details from response
            }
          }).catch(error => {return console.log('error with postKPIValue', error)})
        }
      }))
    }
  }))
}

function filterAndTransform(loadedData, id, transformFunction) {
  if (!loadedData instanceof Array) loadedData = [loadedData]
  console.log(loadedData instanceof Array)
  return Promise.all(loadedData.map(loadedDataItem => {
    console.log('looping through loaded data', loadedDataItem.filename, loadedDataItem.Period)
    const transformedData = transformFunction(loadedDataItem);
    return Promise.all(transformedData.map(transformedDataItem => {
      return benchmarkAPI.findKPIValuesByIDPeriodProvider(transformedDataItem.KPI_ID, transformedDataItem.Period, transformedDataItem.Provider)
        .then(itemFound => {
          if (itemFound.status === 200 && itemFound.data.length === 0) {
            // console.log(id, transformedDataItem.Period, transformedDataItem.Provider, 'data item not found so loading')
            return transformedDataItem
          } //else {
            // return 'already loaded' // console.log(id, transformedDataItem.Period, 'already loaded')
          //}
        })
        .catch(err => {
          return console.log('Error checking KPI has been loaded for that period', err.message)
        })
    }))
      .then(transformedData => {return transformedData})
      .catch(err => console.log(err))
  }))
    .then(loadedData => {return loadedData})
    .catch(err => console.log(err))
}

const transformData = function (datasource, id, transformFunction, mongo) {
  return benchmarkAPI.getDatasourceLoads(datasource).then(loadedData => {
    console.log('about to filter and transform loadedData for', id, 'in', datasource)
    return filterAndTransform(loadedData.data.loads, id, transformFunction)
  }).then(transformedData => {
    console.log('about to save transformed data for', id, 'in', datasource)
    return saveTransformedData(transformedData)
  }).catch(err => {
    console.log('Error transforming data', err, 'datasource:', datasource, 'KPI_ID:', id)
  })
}

const transformDataByFile = function (file, datasource, id, transformFunction, mongo) {
  return benchmarkAPI.findLoadByDatasourceFilename(datasource, file).then(loadedData => {
    console.log('about to filter and transform loadedData for', id, 'in', datasource)
    return filterAndTransform(loadedData.data.loads, id, transformFunction)
  }).then(transformedData => {
    console.log('about to save transformed data for', id, 'in', datasource)
    return saveTransformedData(transformedData)
  })
  .catch(err => {
    console.log('Error transforming data', err.message, 'datasource:', datasource, 'KPI_ID:', id)
  })
}

module.exports = {checkDataStructure, loadFileToMongo, transformData, transformDataByFile};