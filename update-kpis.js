require('./config/config');
// const {mongoose} = require('./db/mongoose');
const mongoXlsx = require('mongo-xlsx');
const benchmarkAPI = require('./api/benchmark-api');

const kpiInfoFile = "../Benchmarking_Lookup.xlsx";

mongoXlsx.xlsx2MongoData(kpiInfoFile, {}, function(err, mongoData) {
    mongoData[1].forEach(kpi => {
        console.log(kpi)
        benchmarkAPI.getKPIByID(kpi.KPI_ID).then(foundKpi => {
            if (foundKpi.data.length === 0) {
                let newKPI = {
                    KPI_ID: kpi.KPI_ID,
                    KPI_name: kpi.KPI_name,
                    KPI_description: kpi.KPI_description,
                    KPI_area: kpi.KPI_area,
                    datasource: kpi.datasource,
                    frequency: kpi.frequency,
                    format: kpi.format
                }
                benchmarkAPI.postKPI(newKPI)
            } 
        })
    })
})