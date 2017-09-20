// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'qar';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            loadDataItem["Other Referrals Made"].toString().length > 0 && //check it has field for Value
            loadDataItem["Other Referrals Made"].toString() !== '-' &&
            loadDataItem["GP Referrals Made"].toString().length > 0 && //check it has field for Value
            loadDataItem["GP Referrals Made"].toString() !== '-' &&
            loadDataItem["First Attendances Seen"].toString().length > 0 && //check it has field for Value
            loadDataItem["First Attendances Seen"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 152,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Provider_Code: loadDataItem["Provider Code"],
                Value: (loadDataItem["GP Referrals Made"] + loadDataItem["Other Referrals Made"]) / loadDataItem["First Attendances Seen"] ,
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};