// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'aae';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
        load.data.forEach(loadDataItem => {
            if (loadDataItem && //check item exists
                loadDataItem.Provider.length > 0 && //check it has field for Provider
                loadDataItem["Attendances of Type 1 Departments - Major A&E"].toString().length > 0 && //check it has field for Value
                loadDataItem["Attendances of Type 1 Departments - Major A&E"].toString() !== 'N/A'
            ) {
                transformedData.push({
                    KPI_ID: 3,
                    Period: load.Period,
                    Provider: loadDataItem.Provider,
                    Provider_Code: loadDataItem["Provider Code"],
                    Value: loadDataItem["Attendances of Type 1 Departments - Major A&E"],
                    created_From: load._id
                })
            }
        })
    return transformedData; 
}

module.exports = {datasource, transformFunction};