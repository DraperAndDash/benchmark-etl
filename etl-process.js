/* etl-process.js
This file runs through the full etl process, first it loads all data files into
the datasource load collections. It then runs through all kpis and transforms
the data into the kpivalues collection.
*/
require('./config/config'); //sets environment variables
//third party packages
const glob = require('glob-all');
const Promise = require('bluebird');
//local resources
const ETL = require('./etl-helpers');
const benchmarkAPI = require('./api/benchmark-api');
const datasources = require('./datasources/');
const kpis = require('./kpis/');
//local variables
const concurrency = 1; //KEEP THIS AT 1! It controls the number of concurrent requests sent to the database
//list of datasources to be loaded
const datasourceListGlobPattern = [
  './datasources/xx*.js',
  '!./datasources/index.js',
  '!./datasources/dementia.js'
];
const datasourceList = glob.sync(datasourceListGlobPattern);
//list of kpis to be transformed
const kpiListGlobPattern = [
  './kpis/kpi_152.js',
];
const kpiList = glob.sync(kpiListGlobPattern);
//the main process, starts with running through all datasources, when the final promised
//is received it moves onto the kpi list
Promise.map(datasourceList, datasource => {
  datasource = datasource.replace('./datasources/','').replace('.js','');
  console.log(`working on ${datasource} data`)
  const filePaths = glob.sync(datasources[datasource].globPattern);
  return Promise.map(filePaths, file => {
    return ETL.loadFileToMongo(file, datasources[datasource].processData, datasource); 
  }, {concurrency})
}, {concurrency}).then((data) => {
  console.log('data loading promise returned, start transformation process')
  return Promise.map(kpiList, kpi => {
    kpi = kpi.replace('./kpis/','').replace('.js','');
    console.log('looping through kpis, at',kpi)
    return benchmarkAPI.getDatasourceLoads(kpis[kpi].datasource).then(loadList => {
      return Promise.map(loadList.data.loads, loadInfo => {
        return ETL.transformDataByFile(loadInfo.filename, kpis[kpi].datasource, parseInt(kpi.replace('kpi_','')), kpis[kpi].transformFunction)
      })
    })
  }, {concurrency})
}).catch(err => {
  return console.log('Error running ETLProcess', err)
})
