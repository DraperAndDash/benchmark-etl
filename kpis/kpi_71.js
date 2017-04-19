// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'ca62ft';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["AFTER 62 DAYS"].toString().length > 0 && //check it has field for Value
            loadDataItem["AFTER 62 DAYS"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 71,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Provider_Code: loadDataItem["Provider Code"],
                Value: loadDataItem["AFTER 62 DAYS"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};