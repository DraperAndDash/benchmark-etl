// Name of datasource this KPI uses
// !!MUST MATCH THE FILENAME IN datasources FOLDER!!
const datasource = 'rtt';

const fieldnamesWithin18Wks = [
    '>0-1',
    '>1-2',
    '>2-3',
    '>3-4',
    '>4-5',
    '>5-6',
    '>6-7',
    '>7-8',
    '>8-9',
    '>9-10',
    '>10-11',
    '>11-12',
    '>12-13',
    '>13-14',
    '>14-15',
    '>15-16',
    '>16-17',
    '>17-18'
]

// Function to transform data
const transformFunction = function (load) {
    let transformedData = [];
    load.data.forEach(loadDataItem => {
        if (loadDataItem && //check item exists
            loadDataItem["Provider Name"].length > 0 && //check it has field for Provider
            load["Summary"] === "Monthly Referral to Treatment (RTT) waiting times for completed admitted pathways." && //Only Admitted loads
            loadDataItem["Treatment Function Code"] === "AP999" && //Only Total specialty
            fieldnamesWithin18Wks.map(fieldname => {return loadDataItem[fieldname].length > 0}) //check it has field for Value
        ) {
            const Value = fieldnamesWithin18Wks.reduce((p, c, i, a) => {
                console.log('reduce... previous:',p,'current:',c,'index:',i)
                console.log('loadDataItem[c]',loadDataItem[c])
                if (i === 1) {
                    return parseInt(loadDataItem[p]) + parseInt(loadDataItem[c])
                }
                return parseInt(p) + parseInt(loadDataItem[c])
            })
            transformedData.push({
                KPI_ID: 17,
                Period: load.Period,
                Provider: loadDataItem["Provider Name"],
                Value: parseInt(Value),
                created_From: load._id
            })
        }
    })
    return transformedData; 
}

module.exports = {datasource, transformFunction};