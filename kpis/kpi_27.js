// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'rtt';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            load["Summary"] === "Monthly Referral to Treatment (RTT) waiting times for completed non-admitted pathways." && //Only Admitted loads
            loadDataItem["Treatment Function Code"] === "AP999" && //Only Total specialty
            loadDataItem["Total number of completed pathways (with a known clock start)"].toString().length > 0 && //check it has field for Value
            loadDataItem["Total number of completed pathways (with a known clock start)"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 27,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Value: loadDataItem["Total number of completed pathways (with a known clock start)"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};