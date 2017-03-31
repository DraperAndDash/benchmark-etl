// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'ca2ww';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["WITHIN 14 DAYS"].toString().length > 0 && //check it has field for Value
            loadDataItem["WITHIN 14 DAYS"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 42,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Value: loadDataItem["WITHIN 14 DAYS"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};