const mongoXlsx = require('mongo-xlsx');
const Promise = require('bluebird');
const benchmarkAPI = require('./api/benchmark-api');

const concurrency = 1;

const checkDataStructure = function(...objects) {
  const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
  // console.log(allKeys)
  const union = new Set(allKeys);
  // console.log(union)
  return objects.every(object => union.size === Object.keys(object).length);
}

const convertGregorianDateToUnix = function(number) {
    return (number - (70 * 365.25)) * 24 * 60 * 60 * 1000 - (19 * 60 * 60 * 1000); 
}

const kpiValueStructure = {
  "KPI_ID" : undefined,
  "Period" : undefined,
  "Provider" : undefined,
  "Provider_Code" : undefined,
  "Value" : undefined,
  "created_From" : undefined
}

const loadFileToMongo = function (extractedFile, processFunction, datasource) {
  return mongoXlsx.xlsx2MongoData(extractedFile, {}, function(err, mongoData) {
    const formattedMongoData = processFunction(mongoData);
    formattedMongoData.filename = extractedFile;
    if (formattedMongoData.Period === "Invalid date") {
      return console.log('Error with load, invalid date', formattedMongoData.filename)
    }
    return benchmarkAPI.postLoad(datasource, formattedMongoData).then(response => {
      if (response.status === 200) {
        return console.log(formattedMongoData.filename, 'loaded into', datasource)
        // return {message: `${response.data.filename} + 'loaded into' ${response.data._id}`}
      } else {
        // return console.log(response.status, 'Error loading', extractedFile); //Add in details from response
        return {message: `${response.status} + 'Error loading' + ${extractedFile}`}
      }
    })
  })
}

function saveTransformedData(transformedData) {
  if (!transformedData instanceof Array) transformedData = [transformedData]

  return Promise.map(transformedData, (transformedDataItem, i) => {
    console.log('looping through transformedData', i)
    if (!transformedDataItem instanceof Array) transformedDataItem = [transformedDataItem]
    if (transformedDataItem) {
      return Promise.map(transformedDataItem, transformedDataItemElement => {
        if (transformedDataItemElement && checkDataStructure(transformedDataItemElement, kpiValueStructure)) {
          if (transformedDataItemElement.Period === "Invalid date") {
            return 'invalid date error' // console.log('invalid date error')
          }
          return benchmarkAPI.postKPIValue(transformedDataItemElement).then(response => {
            if (response.status && response.status === 200) {
              // return console.log('new kpi value saved in ', response.data._id)
            } else {
              return console.log('response from postKPIValue !== 200', response, response.config.data); 
            }
          }).catch(error => {return console.log('error with postKPIValue', error)})
        }
      }, {concurrency})
    }
  }, {concurrency})
}

function filterAndTransform(loadedData, id, transformFunction, datasource) {
  if (!loadedData instanceof Array) loadedData = [loadedData]

  return Promise.map(loadedData, loadedDataItem => {
    const transformedData = transformFunction(loadedDataItem);
    return Promise.map(transformedData, transformedDataItem => {
      if (!checkDataStructure(transformedDataItem, kpiValueStructure)) {
        return console.log('Error! searching for KPI Value but transformedDataItem does not have correct structure')
      }
      return transformedDataItem
    }, {concurrency})
      .then(transformedData => {return transformedData})
      .catch(err => console.log(err))
  }, {concurrency})
    .then(loadedData => {return loadedData})
    .catch(err => console.log(err))
}

const transformData = function (datasource, id, transformFunction) {
  return benchmarkAPI.getDatasourceLoads(datasource).then(loadedData => {
    console.log('about to filter and transform loadedData for', id, 'in', datasource)
    return filterAndTransform(loadedData.data.loads, id, transformFunction, datasource)
  }).then(transformedData => {
    console.log('about to save transformed data for', id, 'in', datasource)
    return saveTransformedData(transformedData)
  }).catch(err => {
    console.log('Error transforming data', err, 'datasource:', datasource, 'KPI_ID:', id)
  })
}

const transformDataByFile = function (file, datasource, id, transformFunction) {
  return benchmarkAPI.findLoadByDatasourceFilename(datasource, file).then(loadedData => {
    console.log('about to filter and transform loadedData for', id, 'in', datasource)
    return filterAndTransform(loadedData.data.loads, id, transformFunction)
  }).then(transformedData => {
    console.log('about to save transformed data for', id, 'in', datasource)
    return saveTransformedData(transformedData)
  })
  .catch(err => {
    console.log('Error transforming data', err, 'datasource:', datasource, 'KPI_ID:', id)
  })
}

module.exports = {checkDataStructure, convertGregorianDateToUnix, loadFileToMongo, transformData, transformDataByFile};