const XLSX = require('xlsx');
const moment = require('moment');
const glob = require('glob-all');
const ETL = require('./etl-helpers');

const globPattern = [
    // '../nhs_england/*.xls*'
    // '../nhs_england/Dementia-Data-Collection-*.xls*'
    '../nhs_england/Dementia-Data-Collection-April-2014-XLS-39KB.xlsx'
];

const fileList = glob.sync(globPattern)
fileList.forEach((file) => {
    let xlsxFile
    try {
      xlsxFile = XLSX.readFile(file)
    } catch (err) {
      return console.log("Error! reading file", err)
    }
    console.log(file)
    // let xlsxFile
    // try {
    //   xlsxFile = XLSX.readFile(fileList[0])
    // } catch (err) {
    //   return console.log("Error! reading file", err)
    // }
    // console.log(xlsxFile)
    let sheetName, metaSheetName
    for (let i=0; i<xlsxFile.SheetNames.length; i++) {
        if (xlsxFile.SheetNames[i].toString().includes('Front')) metaSheetName = xlsxFile.SheetNames[i]
        if (!xlsxFile.SheetNames[i].toString().includes('Front') &&
            !xlsxFile.SheetNames[i].toString().includes('Macro') &&
            !xlsxFile.SheetNames[i].toString().includes('Revision') &&
            !xlsxFile.SheetNames[i].toString().includes('Trusts')
        ) sheetName = xlsxFile.SheetNames[i]
    }
    let mongoDataRaw, metaData
    try {
        mongoDataRaw = XLSX.utils.sheet_to_json(xlsxFile.Sheets[sheetName], {header: "A", raw: true})
        metaData = XLSX.utils.sheet_to_json(xlsxFile.Sheets[metaSheetName], {header: "A", raw: true})
    } catch (err) {
        return console.log('Error! xlsx.utils.sheet_to_json failed', err, file)
    }
    // console.log(xlsxFile.Sheets["Provider"])
    // console.log(mongoDataRaw)
    // console.log(metaDataRaw)
    // let metaData = mongoDataRaw.slice(1,11)
    let formattedMongoData = {}
    metaData.forEach((d, i) => {
      if (metaData[i] && metaData[i].A && metaData[i].B) {
        let newMetaDataPropertyName = metaData[i].A.replace("'","").replace(":","");
        formattedMongoData[newMetaDataPropertyName] = metaData[i].B;
      }
    })
    // console.log(file)
    // console.log(fileList[0])

    if (formattedMongoData.Period.slice(0,1) === "Q") {
        formattedMongoData.PeriodType = 'Quarterly'
        // convert format Q2 2016/17 to a date...
        if (formattedMongoData.Period.toString().includes('Q1')) {
            formattedMongoData.Period = 'June ' + formattedMongoData.Period.slice(3,7)
        } else if (formattedMongoData.Period.toString().includes('Q2')) {
            formattedMongoData.Period = 'September ' + formattedMongoData.Period.slice(3,7)
        } else if (formattedMongoData.Period.toString().includes('Q3')) {
            formattedMongoData.Period = 'December ' + formattedMongoData.Period.slice(3,7)
        } else if (formattedMongoData.Period.toString().includes('Q4')) {
            formattedMongoData.Period = 'March 20' + formattedMongoData.Period.slice(8,10)
        } else if (formattedMongoData.Period.toString().includes('Quarter 1')) {
            formattedMongoData.Period = 'June ' + formattedMongoData.Period.slice(12,16)
        } else if (formattedMongoData.Period.toString().includes('Quarter 2')) {
            formattedMongoData.Period = 'September ' + formattedMongoData.Period.slice(12,16)
        } else if (formattedMongoData.Period.toString().includes('Quarter 3')) {
            formattedMongoData.Period = 'December ' + formattedMongoData.Period.slice(12,16)
        } else if (formattedMongoData.Period.toString().includes('Quarter 4')) {
            formattedMongoData.Period = 'March 20' + formattedMongoData.Period.slice(17,19)
        }
    }
    formattedMongoData.Period = moment(new Date(formattedMongoData.Period)).format("DD/MM/YYYY")
    

    // console.log(formattedMongoData.Period)
    let dataMapping
    for (let i=0; i<25; i++) {
        if (mongoDataRaw[i] && mongoDataRaw[i].A === 'Org name') {
            dataMapping = mongoDataRaw[i]
            formattedMongoData.data = mongoDataRaw.slice(i+1);
        }
    }
    // console.log(dataMapping)
    // console.log(mongoDataRaw)
    if (formattedMongoData.PeriodType === 'Quarterly') {
        const keepColumns = ['A','B','W','X','Y','Z','AA','AB','AC','AD','AE']
        for (var prop in dataMapping) {
            if (dataMapping.hasOwnProperty(prop) && keepColumns.indexOf(prop) === -1) delete dataMapping[prop]
        }
    }
    console.log(dataMapping)
    
    formattedMongoData.data.forEach(function (obj) {
      for (var prop in obj) {
        if (formattedMongoData.PeriodType === 'Quarterly' && obj.hasOwnProperty(prop) && keepColumns.indexOf(prop) === -1) {
            delete obj[prop]
        }
        if (obj.hasOwnProperty(prop)) {
            obj[dataMapping[prop]] = obj[prop]
            delete obj[prop]
        }
      }
    })

    console.log(formattedMongoData.data[0])
});
    

// const mongoDataRaw = XLSX.utils.sheet_to_json(wb.Sheets["Provider"], {header: "A", raw: true})
