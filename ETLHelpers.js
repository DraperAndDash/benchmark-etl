const mongoXlsx = require('mongo-xlsx');
const {KPIValue} = require('./models/KPIValue');
const {KPI} = require('./models/KPI');
const Promise = require('bluebird');

const loadFileToMongo = function (extractedFile, mongoModel, processFunction, datasource) {
  return mongoModel.findByFilename(extractedFile)
    .then(extractedFileFound => {
        if (extractedFileFound === null) {
            return mongoXlsx.xlsx2MongoData(extractedFile, {}, function(err, mongoData) {
              const formattedMongoData = processFunction(mongoData);
              formattedMongoData.filename = extractedFile;
              const newMongoModel = new mongoModel(formattedMongoData);
              return newMongoModel.save()
                .catch(err => {
                  return console.log('Error loading file to mongo', err.message)
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
        // console.log('getting ready to save', transformedDataItemElement.KPI_ID, transformedDataItemElement.Period)
        const newKPIValue = new KPIValue(transformedDataItemElement);
        return newKPIValue.save()
          .then((savedKPIValue) => {
            // return console.log('new kpi value saved', savedKPIValue.KPI_ID, savedKPIValue.Period)
          })
          .catch(err => {
            return console.log('Error saving new KPIValue', err.message)
          })
      }))
      }
  }))
}

function filterAndTransform(loadedData, id, transformFunction) {
  if (!loadedData instanceof Array) loadedData = [loadedData]
  
  return Promise.all(loadedData.map((loadedDataItem, i) => {
    console.log('looping through loaded data', i )
    return KPIValue.findByIDPeriod(id, loadedDataItem.Period)
      .then(loadedDataItemFound => {
        if (loadedDataItemFound === null) {
          console.log(id, loadedDataItem.Period, 'data item not found so loading')
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

const transformData = function (mongoModel, id, transformFunction, mongo) {
  return mongoModel.getAll().then(loadedData => {
    console.log('about to filter and transform loadedData for', id, 'in', mongoModel.modelName)
    return filterAndTransform(loadedData, id, transformFunction)
  }).then(transformedData => {
    console.log('about to save transformed data for', id, 'in', mongoModel.modelName)
    return saveTransformedData(transformedData)
  })
  // .then(() => {
  //   console.log('transformData complete, disconnecting')
  //   return mongo.disconnect()
  // })
  .catch(err => {
    console.log('Error transforming data', err.message, 'datasource:', mongoModel.modelName, 'KPI_ID:', id)
  })
}

module.exports = {loadFileToMongo, transformData};