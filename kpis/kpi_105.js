// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'audiocomp';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["Patients with unknown clock start date"].toString().length > 0 && //check it has field for Value
            loadDataItem["Patients with unknown clock start date"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 105,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Provider_Code: loadDataItem["Provider Code"],
                Value: loadDataItem["Patients with unknown clock start date"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};