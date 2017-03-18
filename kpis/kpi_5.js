// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'aae';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
        load.data.forEach(loadDataItem => {
            if (loadDataItem && //check item exists
                loadDataItem.Name.length > 0 && //check it has field for Provider
                loadDataItem["Attendances of Type 3 Departments - Other A&E/Minor Injury Unit"].toString().length > 0 && 
                loadDataItem["Attendances of Type 3 Departments - Other A&E/Minor Injury Unit"].toString() !== 'N/A' 
            ) {
                transformedData.push({
                    KPI_ID: 5,
                    Period: load.Period,
                    Provider: loadDataItem.Name,
                    Value: loadDataItem["Attendances of Type 3 Departments - Other A&E/Minor Injury Unit"],
                    created_From: load._id
                })
            }
        })
    return transformedData; 
}

module.exports = {datasource, transformFunction};