// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'aae';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    // loads.forEach(load => {
        load.data.forEach(loadDataItem => {
            if (loadDataItem && //check item exists
                loadDataItem.Name && //check it has field for Provider
                loadDataItem["Total attendances"] //check it has field for Value
            ) {
                transformedData.push({
                    KPI_ID: 2,
                    Period: load.Period,
                    Provider: loadDataItem.Name,
                    Value: loadDataItem["Total attendances"],
                    created_From: load._id
                })
            }
        })
    // })
    return transformedData; 
}

module.exports = {datasource, transformFunction};