// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'dtocsnapreason';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["C) Waiting Further NHS Non-Acute Care"].toString().length > 0 && //check it has field for Value
            loadDataItem["C) Waiting Further NHS Non-Acute Care"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 121,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Provider_Code: loadDataItem["Provider Code"],
                Value: loadDataItem["C) Waiting Further NHS Non-Acute Care"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};