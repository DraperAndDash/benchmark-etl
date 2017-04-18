// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'diag';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["Number waiting 6+ Weeks"].toString().length > 0 && //check it has field for Value
            loadDataItem["Number waiting 6+ Weeks"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 97,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Value: loadDataItem["Number waiting 6+ Weeks"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};