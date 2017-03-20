// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'aae';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem.Name.length > 0 && //check it has field for Provider
            loadDataItem["Number of patients spending >12 hours from decision to admit to admission"].toString().length > 0 && //check it has field for Value
            loadDataItem["Number of patients spending >12 hours from decision to admit to admission"].toString() !== 'N/A'
        ) {
            transformedData.push({
                KPI_ID: 15,
                Period: load.Period,
                Provider: loadDataItem.Name,
                Value: loadDataItem["Number of patients spending >12 hours from decision to admit to admission"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};