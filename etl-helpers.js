/* etl-helpers.js
This module stores various functions needed to complete the etl process
*/
const XLSX = require('xlsx');
const Promise = require('bluebird');
const benchmarkAPI = require('./api/benchmark-api');
//local variables
const concurrency = 1;//KEEP THIS AT 1! It controls the number of concurrent requests sent to the database
//kpiValueStructure is the desired object structure of a kpivalue collection document
//some checks are run here against the kpivalue ready to be posted which would be better
//handled within the postKpiValue function. Until refactored this will be needed to be 
//kept the same as the kpivalue model
const kpiValueStructure = {
  "KPI_ID" : undefined,
  "Period" : undefined,
  "Provider" : undefined,
  "Provider_Code" : undefined,
  "Value" : undefined,
  "created_From" : undefined
}
//function to check the structure of a JSON object, this ensures all items going into the
//database are of the correct structure
const checkDataStructure = function(...objects) {
  const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
  const union = new Set(allKeys);
  return objects.every(object => union.size === Object.keys(object).length);
}
//function to convert excel gregorian calendar dates to unix dates
const convertGregorianDateToUnix = function(number) {
    return (number - (70 * 365.25)) * 24 * 60 * 60 * 1000 - (19 * 60 * 60 * 1000); 
}
//function to load an excel file, perform a cleansing process and load into relevant datasource
const loadFileToMongo = function (extractedFile, processFunction, datasource) {
  let xlsxFile
  try {
    xlsxFile = XLSX.readFile(extractedFile)
  } catch (err) {
    return console.log("Error! reading file", err)
  }
  const formattedMongoData = processFunction(xlsxFile)
  if (!formattedMongoData) return console.log('Error! Something went wrong with processing data')
  if (formattedMongoData.dataStuctureFailCount) {
    console.log(`Warning! ${formattedMongoData.Title} for ${formattedMongoData.Period} had ${formattedMongoData.dataStuctureFailCount} data structure fails`)
  }
  formattedMongoData.filename = extractedFile;
  if (formattedMongoData.Period === "Invalid date") {
    return console.log('Error with load, invalid date', formattedMongoData.filename)
  }
  return benchmarkAPI.postLoad(datasource, formattedMongoData).then(response => {
    if (response.status === 200) {
      return console.log(formattedMongoData.filename, 'loaded into', datasource)
    } else {
      return console.log('Error loading', extractedFile, 'into', datasource, response); //Add in details from response
    }
  })
}
//function that takes all the transformed data, check the structure and load into kpivalue collection
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
//function to apply kpi specific transform function to every loaded data item
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
/*
//function to get all loads of single datasource then apply kpi transformations and save data
//CURRENTLY REMOVED IN FAVOUR OF THE transformDataByFile FUNCTION AS THE PROCESS FLOWS BETTER
//WORKING THROUGH FILE BY FILE RATHER THAN IN LARGE BATCHES
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
*/
//function to get loaded data of single file then apply kpi transformations and save data
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

module.exports = {
  checkDataStructure, 
  convertGregorianDateToUnix, 
  loadFileToMongo, 
  // transformData, 
  transformDataByFile
};