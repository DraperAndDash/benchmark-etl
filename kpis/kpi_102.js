// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'diag';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["Waiting list tests / procedures (excluding planned)"].toString().length > 0 && //check it has field for Value
            loadDataItem["Waiting list tests / procedures (excluding planned)"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 102,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Provider_Code: loadDataItem["Provider Code"],
                Value: loadDataItem["Waiting list tests / procedures (excluding planned)"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};