// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'canxops';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["Urgent Operations Cancelled for the 2nd or more time"].toString().length > 0 && //check it has field for Value
            loadDataItem["Urgent Operations Cancelled for the 2nd or more time"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 95,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Value: loadDataItem["Urgent Operations Cancelled for the 2nd or more time"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};