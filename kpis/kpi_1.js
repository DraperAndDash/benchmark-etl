// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'aae';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem.Name.length > 0 && //check it has field for Provider
            loadDataItem["Percentage in 4 hours or less (all)"].toString().length > 0 && //check it has field for Value
            loadDataItem["Percentage in 4 hours or less (all)"].toString() !== 'N/A'
        ) {
            transformedData.push({
                KPI_ID: 1,
                Period: load.Period,
                Provider: loadDataItem.Name,
                Value: loadDataItem["Percentage in 4 hours or less (all)"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};