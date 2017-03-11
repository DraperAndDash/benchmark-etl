const mongoXlsx = require('mongo-xlsx');
const {KPIValue} = require('./models/KPIValue');
const Promise = require('bluebird');

const loadFileToMongo = function (extractedFile, mongoModel, processFunction, datasource) {
  mongoModel.findByFilename(extractedFile)
    .then(extractedFileFound => {
        if (extractedFileFound === null) {
            mongoXlsx.xlsx2MongoData(extractedFile, {}, function(err, mongoData) {
              const formattedMongoData = processFunction(mongoData);
              formattedMongoData.filename = extractedFile;
              const newMongoModel = new mongoModel(formattedMongoData);
              newMongoModel.save()
                .catch(err => console.log('Error loading file to mongo', err.message))
            })
        }
      })
    .catch(err => console.log('Error checking if file has been loaded previously', err.message))
};

// Need to test if this conversion to Array works when only uploading single objects
// If this use case ever happens...
// Maybe I should write some tests...

function saveTransformedData(transformedData) {
  if (!transformedData instanceof Array) transformedData = [transformedData]

  return Promise.each(transformedData, transformedDataItem => {
    if (!transformedDataItem instanceof Array) transformedDataItem = [transformedDataItem]
    if (transformedDataItem) {
      return Promise.all(transformedDataItem.map(transformedDataItemElement => {
        const newKPIValue = new KPIValue(transformedDataItemElement);
        return newKPIValue.save()
          .catch(err => console.log('Error saving new KPIValue', err.message))
      }))
      }
  })
}

function filterAndTransform(loadedData, id, transformFunction) {
  if (!loadedData instanceof Array) loadedData = [loadedData]

  return Promise.all(loadedData.map(loadedDataItem => {
    return KPIValue.findByIDPeriod(id, loadedDataItem.Period)
      .then(loadedDataItemFound => {
        if (loadedDataItemFound === null) {
          return transformFunction(loadedDataItem)
        }
      })
      .catch(err => console.log('Error checking KPI has been loaded for that period', err.message))
  }))
}

const transformData = function (mongoModel, id, transformFunction, mongo) {
  mongoModel.getAll().then(loadedData => {
    return filterAndTransform(loadedData, id, transformFunction)
  }).then(transformedData => {
    return saveTransformedData(transformedData)
  }).then(() => {
    mongo.disconnect()
  })
  .catch(err => {
    console.log('Error transforming data', err.message, 'datasource:', mongoModel.modelName, 'KPI_ID:', id)
    mongo.disconnect()
  })
}

module.exports = {loadFileToMongo, transformData};