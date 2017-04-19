// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'rtti';

const fieldnamesBreaches = [
    '>18-19',
    '>19-20',
    '>20-21',
    '>21-22',
    '>22-23',
    '>23-24',
    '>24-25',
    '>25-26',
    '>26-27',
    '>27-28',
    '>28-29',
    '>29-30',
    '>30-31',
    '>31-32',
    '>32-33',
    '>33-34',
    '>34-35',
    '>35-36',
    '>36-37',
    '>37-38',
    '>38-39',
    '>39-40',
    '>40-41',
    '>41-42',
    '>42-43',
    '>43-44',
    '>44-45',
    '>45-46',
    '>46-47',
    '>47-48',
    '>48-49',
    '>49-50',
    '>50-51',
    '>51-52',
    '52 plus'
]

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider"].length > 0 && //check it has field for Provider
            load["Summary"] === "Monthly Referral to Treatment (RTT) waiting times for incomplete pathways." && //Only Admitted loads
            loadDataItem["Treatment Function Code"] === "IP999" && //Only Total specialty
            fieldnamesBreaches.map(fieldname => {return loadDataItem[fieldname].length > 0})
        ) {
            const breaches = fieldnamesBreaches.reduce((p, c, i, a) => {
                if (i === 1) {
                    return parseInt(loadDataItem[p]) + parseInt(loadDataItem[c])
                }
                return parseInt(p) + parseInt(loadDataItem[c])
            })
            transformedData.push({
                KPI_ID: 37,
                Period: load.Period,
                Provider: loadDataItem["Provider"],
                Provider_Code: loadDataItem["Provider Code"],
                Value: parseInt(breaches),
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};