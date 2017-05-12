const XLSX = require('xlsx');
const moment = require('moment');
const glob = require('glob-all');
const ETL = require('./etl-helpers');

const globPattern = [
    // '../nhs_england/*.xls*'
    '../nhs_england/Monthly-Diagnostics-Provider-February-2016*.xls',
    '../nhs_england/Monthly-Diagnostics-Web-File-Provider-*.xls',
    '../nhs_england/Monthly-Diagnostics-Revisions-Web-File-Provider-*.xls',
];

const fileList = glob.sync(globPattern)
// fileList.forEach((file) => {
    // const xlsxFile = XLSX.readFile(file);
    const xlsxFile = XLSX.readFile(fileList[0]);
    const sheetName = "Provider"
    const mongoDataRaw = XLSX.utils.sheet_to_json(xlsxFile.Sheets[sheetName], {header: "A", raw: true})
    // console.log(xlsxFile.Sheets["Provider"])
    console.log(mongoDataRaw)
    let metaData = mongoDataRaw.slice(1,11)
    let formattedMongoData = {}
    metaData.forEach((d, i) => {
      if (metaData[i] && metaData[i].B && metaData[i].C) {
        let newMetaDataPropertyName = metaData[i].B.replace("'","").replace(":","");
        formattedMongoData[newMetaDataPropertyName] = metaData[i].C;
      }
    })
    // console.log(file)
    console.log(fileList[0])

    console.log(formattedMongoData)

    let dataMapping = mongoDataRaw[10];
    console.log(dataMapping)

    formattedMongoData.data = mongoDataRaw.slice(11);

    formattedMongoData.data.forEach(function (obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          obj[dataMapping[prop]] = obj[prop]
          delete obj[prop]
        }
      }
    })

    console.log(formattedMongoData.data[0])
// });
    

// const mongoDataRaw = XLSX.utils.sheet_to_json(wb.Sheets["Provider"], {header: "A", raw: true})
