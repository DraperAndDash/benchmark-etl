require('./config/config');
const {mongoose} = require('./db/mongoose');
const glob = require('glob-all');
const Promise = require('bluebird');
const ETL = require('./etl-helpers');
const datasources = require('./datasources/');
const kpis = require('./kpis/');

const concurrency = 5;
const datasourceListGlobPattern = [
  './datasources/*.js',
  '!./datasources/index.js'
];
const kpiListGlobPattern = [
  './kpis/kpi_*.js',
];
const datasourceList = glob.sync(datasourceListGlobPattern);
const kpiList = glob.sync(kpiListGlobPattern);

Promise.map(datasourceList, datasource => {
  datasource = datasource.replace('./datasources/','').replace('.js','');
  const filePaths = glob.sync(datasources[datasource].globPattern);
  return Promise.map(filePaths, file => {
    return ETL.loadFileToMongo(file, datasources[datasource].mongoModel, datasources[datasource].processData, datasource); 
  }, {concurrency})
}, {concurrency}).then((data) => {
  console.log('data loading promise returned, start transformation process')
  return Promise.map(kpiList, kpi => {
    kpi = kpi.replace('./kpis/','').replace('.js','');
    console.log('looping through kpis, at',kpi)
    return ETL.transformData(kpis[kpi].datasource, parseInt(kpi.replace('kpi_','')), kpis[kpi].transformFunction)
  }, {concurrency})
    .then(() => {
      mongoose.disconnect();
    })
}).catch(err => {
  return console.log('Error running ETLProcess', err.message)
})
