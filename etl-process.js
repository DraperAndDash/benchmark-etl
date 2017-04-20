require('./config/config');
const {mongoose} = require('./db/mongoose');
const glob = require('glob-all');
const Promise = require('bluebird');
const ETL = require('./etl-helpers');
const datasources = require('./datasources/');
const kpis = require('./kpis/');
const benchmarkAPI = require('./api/benchmark-api');

const concurrency = 5;
const datasourceListGlobPattern = [
  './datasources/aae.js',
  '!./datasources/index.js'
];
const kpiListGlobPattern = [
  './kpis/kpi_xxx*.js',
  // './kpis/kpi_[9][6-9].js',
  // './kpis/kpi_[1][0][0-2].js'
  // './kpis/kpi_[0-9].js'

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
    return benchmarkAPI.getDatasourceLoads(kpis[kpi].datasource).then(loadList => {
      return Promise.map(loadList.data.loads, loadInfo => {
        return ETL.transformDataByFile(loadInfo.filename, kpis[kpi].datasource, parseInt(kpi.replace('kpi_','')), kpis[kpi].transformFunction)
      })
    })
  }, {concurrency})
    .then(() => {
      mongoose.disconnect();
    })
}).catch(err => {
  return console.log('Error running ETLProcess', err.message)
})
