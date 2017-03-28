const mongoXlsx = require('mongo-xlsx');
const moment = require('moment');

const extractedFile = "../cancer-data/DECEMBER-2016-CANCER-WAITING-TIMES-PROVIDER-WORKBOOK-FINAL.xlsx";

const convertGregorianDateToUnix = function(number) {
    return (number - (70 * 365.25) - 1) * 24 * 60 * 60 * 1000 - (19 * 60 * 60 * 1000);
}

mongoXlsx.xlsx2MongoData(extractedFile, {}, function(err, mongoData) {
    // mongoData[3].map(dataItem => {
    //     dataItem._no_header_at_col_3 === 'ALL CARE' && console.log(dataItem)
    // })

    let formattedData = {};
    formattedData.Period = moment(convertGregorianDateToUnix(parseInt(mongoData[0][0]['Cancer Waiting Times statistics']))).format("DD/MM/YYYY")
    for (var prop in mongoData[3][1]) {
        formattedData.Summary = prop;
    }
    formattedData.Contact = mongoData[0][mongoData[0].length - 1]['Cancer Waiting Times statistics']
    
    
    // formattedData.data = mongoDataRaw[3].slice(7);
    
    
    console.log(mongoData[3].slice(8,9))
    // console.log(mongoData[3][mongoData[3].length - 1])

})