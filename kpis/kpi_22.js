// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'rtta';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            load["Summary"] === "Monthly Referral to Treatment (RTT) waiting times for completed admitted pathways." && //Only Admitted loads
            loadDataItem["Treatment Function Code"] === "AP999" && //Only Total specialty
            loadDataItem["Average (median) waiting time (in weeks)"].toString().length > 0 && //check it has field for Value
            loadDataItem["Average (median) waiting time (in weeks)"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 22,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Provider_Code: loadDataItem["Provider Code"],
                Value: loadDataItem["Average (median) waiting time (in weeks)"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};