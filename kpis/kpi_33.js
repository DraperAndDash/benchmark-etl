// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'rttna';

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            load["Summary"] === "Monthly Referral to Treatment (RTT) waiting times for completed non-admitted pathways." && //Only Admitted loads
            loadDataItem["Treatment Function Code"] === "NP999" && //Only Total specialty
            loadDataItem["52 plus"].toString().length > 0 && //check it has field for Value
            loadDataItem["52 plus"].toString() !== '-'
        ) {
            transformedData.push({
                KPI_ID: 33,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Provider_Code: loadDataItem["Provider Code"],
                Value: loadDataItem["52 plus"],
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};