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
                loadDataItem["Attendances of Type 1 Departments - Major A&E"] //check it has field for Value
            ) {
                transformedData.push({
                    KPI_ID: 3,
                    Period: load.Period,
                    Provider: loadDataItem.Name,
                    Value: loadDataItem["Attendances of Type 1 Departments - Major A&E"],
                    created_From: load._id
                })
            }
        })
    // })
    return transformedData; 
}

module.exports = {datasource, transformFunction};