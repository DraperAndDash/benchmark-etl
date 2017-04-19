// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'aae';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    // loads.forEach(load => {
        load.data.forEach(loadDataItem => {
            if (loadDataItem && //check item exists
                loadDataItem.Provider.length > 0 && //check it has field for Provider
                loadDataItem["Total attendances"].toString().length > 0 && //check it has field for Value
                loadDataItem["Total attendances"].toString() !== 'N/A'
            ) {
                transformedData.push({
                    KPI_ID: 2,
                    Period: load.Period,
                    Provider: loadDataItem.Provider,
                    Provider_Code: loadDataItem["Provider Code"],
                    Value: loadDataItem["Total attendances"],
                    created_From: load._id
                })
            }
        })
    // })
    return transformedData; 
}

module.exports = {datasource, transformFunction};