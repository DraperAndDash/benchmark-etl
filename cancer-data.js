const mongoXlsx = require('mongo-xlsx');
const moment = require('moment');
const glob = require('glob-all');
const datasources = require('./datasources/');

const extractedFile = "../nhs_england/JANUARY-2016-CANCER-WAITING-TIMES-PROVIDER-WORKBOOK-FINAL.xlsx";
const extractedFiles = glob.sync(["../nhs_england/*-CANCER-WAITING-TIMES-PROVIDER-*.xlsx"]);

const convertGregorianDateToUnix = function(number) {
    return (number - (70 * 365.25) - 1) * 24 * 60 * 60 * 1000 - (19 * 60 * 60 * 1000);
}

const groupByArray = function(xs, key) { 
    return xs.reduce(function (rv, x) { 
        let v = key instanceof Function ? key(x) : x[key]; 
        let el = rv.find((r) => r && r.key === v); 
        if (el) {
             el.values.push(x); 
        } else { 
            rv.push({ key: v, values: [x] }); 
        } 
        return rv; 
    }, []); 
}

// extractedFiles.forEach(extractedFile => {
//     let file = {}
//     file.name = extractedFile;
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
        // mongoData.forEach((mongoDataItem, i) => {
        //     // console.log(Object.keys(mongoDataItem[1]))
        //     file[`Sheet ${i}`] = Object.keys(mongoDataItem[0])[0]
        // })
        // console.log(file)

        // console.log(mongoData[3][mongoData[3].length - 1])



        
        let formattedData = datasources["ca31rare"].processData(mongoData)

        // console.log(groupByArray(formattedData.data, "Provider")[42])

        let objArr = [
            {Provider: 'Hospital 1', TOTAL: 5, WITHIN: 4},
            {Provider: 'Hospital 1', TOTAL: 3, WITHIN: 2},
            {Provider: 'Hospital 2', TOTAL: 10, WITHIN: 8},
            {Provider: 'Hospital 2', TOTAL: 8, WITHIN: 6}
        ];

    //     'Provider Code': undefined,
    //   'Provider': undefined,
    //   'CARE SETTING': undefined,
    //   'CANCER TYPE': undefined,
    //   'TOTAL': undefined,
    //   'WITHIN 31 DAYS': undefined,
    //   'AFTER 31 DAYS': undefined,
    //   'TREATED WITHIN 31 DAYS': undefined,
    //   'WITHIN 31 DAYS': undefined,
    //   '32 TO 38 DAYS': undefined,
    //   '39 TO 48 DAYS': undefined,
    //   '49 TO 62 DAYS': undefined,
    //   'AFTER 62 DAYS': undefined,

        let newMap = new Map();

        formattedData.data.forEach(dataItem => {
            let prevTotal = newMap.get(dataItem.Provider) ? newMap.get(dataItem.Provider).TOTAL : 0;
            let prevWithin31 = newMap.get(dataItem.Provider) ? newMap.get(dataItem.Provider)['WITHIN 31 DAYS'] : 0;
            let prevAfter31 = newMap.get(dataItem.Provider) ? newMap.get(dataItem.Provider)['AFTER 31 DAYS'] : 0;
            let prev32to38 = newMap.get(dataItem.Provider) ? newMap.get(dataItem.Provider)['32 TO 38 DAYS'] : 0;
            let prev39to48 = newMap.get(dataItem.Provider) ? newMap.get(dataItem.Provider)['39 TO 48 DAYS'] : 0;
            let prev49to62 = newMap.get(dataItem.Provider) ? newMap.get(dataItem.Provider)['49 TO 62 DAYS'] : 0;
            let prev63to76 = newMap.get(dataItem.Provider) ? newMap.get(dataItem.Provider)['63 TO 76 DAYS'] : 0;
            let prev77to90 = newMap.get(dataItem.Provider) ? newMap.get(dataItem.Provider)['77 TO 90 DAYS'] : 0;
            let prev91to104 = newMap.get(dataItem.Provider) ? newMap.get(dataItem.Provider)['91 TO 104 DAYS'] : 0;
            let prevAfter104 = newMap.get(dataItem.Provider) ? newMap.get(dataItem.Provider)['AFTER 104 DAYS'] : 0;
            
            newMap.set(dataItem.Provider, {
                "Provider Code": dataItem["Provider Code"],
                "CARE SETTING": dataItem["CARE SETTING"],

                TOTAL: dataItem.TOTAL + prevTotal,
                'WITHIN 31 DAYS': dataItem['WITHIN 31 DAYS'] + prevWithin31,
                'AFTER 31 DAYS': dataItem['AFTER 31 DAYS'] + prevAfter31,
                '32 TO 38 DAYS': dataItem['32 TO 38 DAYS'] + prev32to38,
                '39 TO 48 DAYS': dataItem['39 TO 48 DAYS'] + prev39to48,
                '49 TO 62 DAYS': dataItem['49 TO 62 DAYS'] + prev49to62,
                '63 TO 76 DAYS': dataItem['63 TO 76 DAYS'] + prev63to76,
                '77 TO 90 DAYS': dataItem['77 TO 90 DAYS'] + prev77to90,
                '91 TO 104 DAYS': dataItem['91 TO 104 DAYS'] + prev91to104,
                'AFTER 104 DAYS': dataItem['AFTER 104 DAYS'] + prevAfter104,
            })
        })

        let newFormattedData = [];
    
        newMap.forEach((value, key) => {
            newFormattedData.push({
                Provider: key,
                "Provider Code": value["Provider Code"],
                "CARE SETTING": value["CARE SETTING"],
                TOTAL: value.TOTAL,
                'WITHIN 31 DAYS': value['WITHIN 31 DAYS'],
                'AFTER 31 DAYS': value['AFTER 31 DAYS'],
                'TREATED WITHIN 31 DAYS': value['WITHIN 31 DAYS'] / (value['WITHIN 31 DAYS'] + value['AFTER 31 DAYS']),
                '32 TO 38 DAYS': value['32 TO 38 DAYS'],
                '39 TO 48 DAYS': value['39 TO 48 DAYS'],
                '49 TO 62 DAYS': value['49 TO 62 DAYS'],
                '63 TO 76 DAYS': value['63 TO 76 DAYS'],
                '77 TO 90 DAYS': value['77 TO 90 DAYS'],
                '91 TO 104 DAYS': value['91 TO 104 DAYS'],
                'AFTER 104 DAYS': value['AFTER 104 DAYS'],
            })
        })
        console.log(newFormattedData)

    })
// })

    