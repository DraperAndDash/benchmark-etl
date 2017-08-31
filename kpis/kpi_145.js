// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'qar';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["First Attendances Seen"].toString().length > 0 && //check it has field for Value
            loadDataItem["First Attendances Seen"].toString() !== '-' &&
            loadDataItem["First Attendances DNA"].toString().length > 0 && //check it has field for Value
            loadDataItem["First Attendances DNA"].toString() !== '-' &&
            loadDataItem["Subsequent Attendances Seen"].toString().length > 0 && //check it has field for Value
            loadDataItem["Subsequent Attendances Seen"].toString() !== '-' &&
            loadDataItem["Subsequent Attendances DNA"].toString().length > 0 && //check it has field for Value
            loadDataItem["Subsequent Attendances DNA"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 145,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Provider_Code: loadDataItem["Provider Code"],
                Value: (loadDataItem["First Attendances DNA"] + loadDataItem["Subsequent Attendances DNA"]) /
                    (loadDataItem["First Attendances DNA"] + loadDataItem["Subsequent Attendances DNA"] + loadDataItem["First Attendances Seen"] + loadDataItem["Subsequent Attendances Seen"]),
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};