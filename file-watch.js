/* file-watch.js
This file is always running on the server and looks for files appearing in the scraped file
directory. When a file is found then it is run through the relevant etl process.
*/
//third party packages
const Promise = require('bluebird');
const watch = require('watch');
const glob = require('glob-all');
const fs = require('fs-extra');
const path = require('path');
//local packages
const ETL = require('./etl-helpers');
const datasources = require('./datasources/');
const kpis = require('./kpis/');
//local variables
const concurrency = 1; //KEEP THIS AT 1! It controls the number of concurrent requests sent to the database
const datasourceListGlobPattern = [
  './datasources/*.js',
  '!./datasources/index.js'
];
const datasourceList = glob.sync(datasourceListGlobPattern);
const kpiListGlobPattern = [
  './kpis/kpi_*.js',
];
const kpiList = glob.sync(kpiListGlobPattern);

watch.watchTree('../nhs_england/', function (f, curr, prev) {
    if (typeof f == "object" && prev == null && curr == null) {
        // Finished walking tree
        // Wait until another scrape has been performed...
        console.log('finished walking tree')
    } else if (prev === null) {
      // f is a new file
      console.log(f, 'was added')
      Promise.map(datasourceList, datasource => {
          datasource = datasource.replace('./datasources/','').replace('.js','');
          if (datasources[datasource].regex.test(f)) {
              console.log(f, 'matched to', datasource)
              return ETL.loadFileToMongo(f, datasources[datasource].processData, datasource)
                .then((dataFromLoadFileToMongo) => { //At the moment nothing returned from loadFileToMongo Promise
                  return {f, datasource, dataFromLoadFileToMongo}
                }).catch(err => console.log('Error with loadFileToMongo', err))
            }
      }, {concurrency}).then((response) => {
        Promise.map(kpiList, kpi => {
          kpi = kpi.replace('./kpis/','').replace('.js','');
          if (response[0] && response[0].datasource === kpis[kpi].datasource) {
            return ETL.transformDataByFile(response[0].f, kpis[kpi].datasource, parseInt(kpi.replace('kpi_','')), kpis[kpi].transformFunction)
          }
        }, {concurrency}).then(response => {
          // return console.log('then from transformDataByFile', response)
        }).catch(error => {
          return console.log('catch from transformDataByFile', error)
        })
      }).catch((error) => console.log('Error', error))
    } else if (curr.nlink === 0) {
      // f was removed
      return console.log(`${f} was removed`)
    } else {
      // f was changed
      return console.log(`${f} was changed`)
    }
})