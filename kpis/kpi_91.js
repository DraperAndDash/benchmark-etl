// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'ccbeds';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["% of Open Beds Occupied - Paediatric intensive care beds"].toString().length > 0 && //check it has field for Value
            loadDataItem["% of Open Beds Occupied - Paediatric intensive care beds"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 91,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Provider_Code: loadDataItem["Provider Code"],
                Value: loadDataItem["% of Open Beds Occupied - Paediatric intensive care beds"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};