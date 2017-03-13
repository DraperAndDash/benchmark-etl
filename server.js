require('./config/config');
const {mongoose} = require('./db/mongoose');
const glob = require('glob-all');
const Promise = require('bluebird');
const ETL = require('./ETLHelpers');
const datasources = require('./datasources/');
const kpis = require('./kpis/');

const datasourceListGlobPattern = [
  './datasources/*.js',
  '!./datasources/index.js'
];
const kpiListGlobPattern = [
  './kpis/kpi_*.js',
];
const datasourceList = glob.sync(datasourceListGlobPattern);
const kpiList = glob.sync(kpiListGlobPattern);

Promise.all(datasourceList.map(datasource => {
  datasource = datasource.replace('./datasources/','').replace('.js','');
  const filePaths = glob.sync(datasources[datasource].globPattern);
  return Promise.all(filePaths.map(file => {
    return ETL.loadFileToMongo(file, datasources[datasource].mongoModel, datasources[datasource].processData, datasource); 
  }))
})).then((data) => {
  console.log('data loading promise returned, start transformation process')
  return Promise.all(kpiList.map(kpi => {
    kpi = kpi.replace('./kpis/','').replace('.js','');
    console.log('looping through kpis, at',kpi)
    return ETL.transformData(datasources[kpis[kpi].datasource].mongoModel, parseInt(kpi.replace('kpi_','')), kpis[kpi].transformFunction, mongoose)
  }))
    .then(() => {
      mongoose.disconnect();
    })
}).catch(err => {
  return console.log('Error running loadFIles()', err.message)
})

// Getting different total number of KPIValues when running
// Data loading and transforming need to be completely seperate
// To allow for the data to be completed loaded and finished before transforming.
// Also getting different results on running transform section...
// Need to backup collection, re-run and compare the differences