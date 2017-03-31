const mongoXlsx = require('mongo-xlsx');
const moment = require('moment');
const glob = require('glob-all');

const extractedFile = "../nhs_england/JANUARY-2016-CANCER-WAITING-TIMES-PROVIDER-WORKBOOK-FINAL.xlsx";
const extractedFiles = glob.sync(["../nhs_england/*-CANCER-WAITING-TIMES-PROVIDER-*.xlsx"]);

const convertGregorianDateToUnix = function(number) {
    return (number - (70 * 365.25) - 1) * 24 * 60 * 60 * 1000 - (19 * 60 * 60 * 1000);
}

extractedFiles.forEach(extractedFile => {
    let file = {}
    file.name = extractedFile;
    mongoXlsx.xlsx2MongoData(extractedFile, {}, function(err, mongoData) {
        // mongoData[3].map(dataItem => {
        //     dataItem._no_header_at_col_3 === 'ALL CARE' && console.log(dataItem)
        // })

        // let formattedData = {};
        // formattedData.Period = moment(convertGregorianDateToUnix(parseInt(mongoData[0][0]['Cancer Waiting Times statistics']))).format("DD/MM/YYYY")
        // for (var prop in mongoData[3][1]) {
        //     formattedData.Summary = prop;
        // }
        // formattedData.Contact = mongoData[0][mongoData[0].length - 1]['Cancer Waiting Times statistics']
        
        // formattedData.mapping = mongoData[13][8];
        // formattedData.data = mongoData[13].slice(9);
        
        
        // console.log(formattedData)
        mongoData.forEach((mongoDataItem, i) => {
            // console.log(Object.keys(mongoDataItem[1]))
            file[`Sheet ${i}`] = Object.keys(mongoDataItem[0])[0]
        })
        console.log(file)

        // console.log(mongoData[3][mongoData[3].length - 1])

    })
})

    