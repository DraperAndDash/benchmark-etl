// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'dtocdelayreason';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["F) Awaiting Community Equipment and Adaptions"].toString().length > 0 && //check it has field for Value
            loadDataItem["F) Awaiting Community Equipment and Adaptions"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 141,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Provider_Code: loadDataItem["Provider Code"],
                Value: loadDataItem["F) Awaiting Community Equipment and Adaptions"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};