// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'dtocsnapreason';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["DII) Awaiting Nursing Home Placement or Availability"].toString().length > 0 && //check it has field for Value
            loadDataItem["DII) Awaiting Nursing Home Placement or Availability"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 123,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Provider_Code: loadDataItem["Provider Code"],
                Value: loadDataItem["DII) Awaiting Nursing Home Placement or Availability"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};