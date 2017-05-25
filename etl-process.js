require('./config/config');
// const {mongoose} = require('./db/mongoose');
const glob = require('glob-all');
const Promise = require('bluebird');
const ETL = require('./etl-helpers');
const datasources = require('./datasources/');
const kpis = require('./kpis/');
const benchmarkAPI = require('./api/benchmark-api');

const concurrency = 1;
const datasourceListGlobPattern = [
  // './datasources/*.js',
  './datasources/xxx.js',
  // './datasources/dementia.js',
  '!./datasources/index.js'
];
const kpiListGlobPattern = [
  // './kpis/kpi_*.js',
  // './kpis/kpi_xxx.js',
  // './kpis/kpi_2[0-9].js',
  // './kpis/kpi_3[0-9].js',
  './kpis/kpi_42.js',
];
const datasourceList = glob.sync(datasourceListGlobPattern);
const kpiList = glob.sync(kpiListGlobPattern);

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
        console.log('transformig file', loadInfo.filename)
        return ETL.transformDataByFile(loadInfo.filename, kpis[kpi].datasource, parseInt(kpi.replace('kpi_','')), kpis[kpi].transformFunction)
      })
    })
  }, {concurrency})
}).catch(err => {
  return console.log('Error running ETLProcess', err)
})
