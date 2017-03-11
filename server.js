require('./config/config');
const {mongoose} = require('./db/mongoose');
const glob = require('glob-all');
const ETL = require('./ETLHelpers');
const datasources = require('./datasources/');
const kpis = require('./kpis/');

const datasourceListGlobPattern = [
  './datasources/*.js',
  '!./datasources/index.js'
];
const datasourceList = glob.sync(datasourceListGlobPattern);

datasourceList.forEach(datasource => {
  datasource = datasource.replace('./datasources/','').replace('.js','');
  const filePaths = glob.sync(datasources[datasource].globPattern);
  filePaths.forEach(file => {
    ETL.loadFileToMongo(file, datasources[datasource].mongoModel, datasources[datasource].processData, datasource); 
  })
});

const kpiListGlobPattern = [
  './kpis/kpi_*.js',
];
const kpiList = glob.sync(kpiListGlobPattern);

kpiList.forEach(kpi => {
  kpi = kpi.replace('./kpis/','').replace('.js','');
  ETL.transformData(datasources[kpis[kpi].datasource].mongoModel, parseInt(kpi.replace('kpi_','')), kpis[kpi].transformFunction, mongoose)
})

