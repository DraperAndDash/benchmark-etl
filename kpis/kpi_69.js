// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'ca62ft';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["TOTAL"].toString().length > 0 && //check it has field for Value
            loadDataItem["TOTAL"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 69,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Value: loadDataItem["TOTAL"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};