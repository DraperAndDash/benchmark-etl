/* index.js
This file contains the setup for the express app and all the API routes
*/
//load environment variables and app config
require('./config/config');
//load third party packages
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} =require('mongodb');
const moment = require('moment');
const glob = require('glob-all');
const xmlify = require('xmlify');
const {mongoose} = require('./db/mongoose');
//load local packages
const benchmarkAPI = require('./api/benchmark-api');
const datasources = require('./datasources/');
const kpis = require('./kpis/');
const {kpivalue} = require('./models/kpi-value');
const {kpi} = require('./models/kpi');
//local variables
const datasourceListGlobPattern = [
  './datasources/*.js',
  '!./datasources/index.js'
];
const datasourceList = glob.sync(datasourceListGlobPattern);
const kpiListGlobPattern = [
  './kpis/kpi_*.js'
];
const kpiList = glob.sync(kpiListGlobPattern);

const formatPeriod = (period) => {
    return period.substring(6) + period.substring(3,5) + period.substring(0,2)
}

var app = express();
const port = process.env.PORT;

app.use(bodyParser.json({limit: '10000mb'}));
app.use(bodyParser.urlencoded({limit: '10000mb'}));

app.use(function(req, res, next) {
res.header("Access-Control-Allow-Origin", "*");
res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, x-auth, Content-Type, Accept");
res.header("Access-Control-Allow-Methods", "PATCH");
next();
});

//load collection routes - there is one for each datasource
app.post('/loads/:datasource', /*authenticate,*/ (req, res) => {
    const datasource = req.params.datasource;
    datasources[datasource].mongoModel.updateOne(
        {Period: req.body.Period},
        {$set: req.body,},
        {upsert: true,
        setDefaultsOnInsert: true}
    )
    .then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/loads/:datasource', /*authenticate,*/ (req, res) => {
    const datasource = req.params.datasource;
    if (!datasources[datasource]) {
        res.status(400).send({error: "DATASOURCE NOT EXIST"})
    }
    // datasources[datasource].mongoModel.find({}, {Period:1, filename:1}).then((loads) => {
    datasources[datasource].mongoModel.aggregate()
    .match({})
    .project({
        Period: 1,
        filename: 1,
        dataLength: {$size:"$data"}
    }).then((loads) => {
        loads.sort((a,b) => {
            return formatPeriod(a.Period) - formatPeriod(b.Period)
        })
        res.send({loads});
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/loads/:datasource/:filename', /*authenticate,*/ (req, res) => {
    const datasource = req.params.datasource;
    const filename = decodeURIComponent(req.params.filename);
    if (!datasources[datasource]) {
        res.status(400).send({error: "DATASOURCE NOT EXIST"})
    }
    datasources[datasource].mongoModel.find({filename: filename}).then((loads) => {
        res.send({loads});
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/loads/:datasource/period/:period', /*authenticate,*/ (req, res) => {
    const datasource = req.params.datasource;
    const period = decodeURIComponent(req.params.period);
    if (!datasources[datasource]) {
        res.status(400).send({error: "DATASOURCE NOT EXIST"})
    }
    datasources[datasource].mongoModel.find({Period: period}).then((loads) => {
        res.send({loads});
    }, (e) => {
        res.status(400).send(e);
    });
});

app.delete('/loads/:datasource', /*authenticate,*/ (req, res) => {
    const datasource = req.params.datasource;
    if (!datasources[datasource]) {
        res.status(400).send({error: "DATASOURCE NOT EXIST"})
    }
    datasources[datasource].mongoModel.remove({}).then((count) => {
        res.send({count});
    }, (e) => {
        res.status(400).send(e);
    })
})

app.delete('/loads/:datasource/:filename', /*authenticate,*/ (req, res) => {
    const datasource = req.params.datasource;
    const filename = decodeURIComponent(req.params.filename);
    if (!datasources[datasource]) {
        res.status(400).send({error: "DATASOURCE NOT EXIST"})
    }
    datasources[datasource].mongoModel.findOneAndRemove({filename: filename}).then((doc) => {
        res.send({doc});
    }, (e) => {
        res.status(400).send(e);
    })
})

//kpivalue collection routes
app.post('/kpivalues', /*authenticate,*/ (req, res) => {
    kpivalue.updateOne(
        {KPI_ID: req.body.KPI_ID, Period: req.body.Period, Provider: req.body.Provider, Provider_Code: req.body.Provider_Code},
        {$set: req.body},
        {upsert: true}
    ).then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/kpivalues', /*authenticate,*/ (req, res) => {
    let currentPage = 1;
    if (typeof req.query.page !== 'undefined') {
        currentPage = +req.query.page;
    }
    req.setTimeout(0)
    kpivalue.paginate({}, {
        page: currentPage, 
        limit: 500,
        sort: {KPI_ID: 1, Period: 1, Provider: 1}
    }).then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/kpivalues/:id', /*authenticate,*/ (req, res) => {
    const KPI_ID = req.params.id;
    kpivalue.find({KPI_ID}).then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/kpivalues/:id/xml', /*authenticate,*/ (req, res) => {
    const KPI_ID = req.params.id;
    kpivalue.find({KPI_ID}).then((doc) => {
        res.set('Content-Type', 'text/xml');
        var doc = doc.reduce(function(acc, cur, i) {
            acc[`kpivalue${i}`] = cur;
            return acc;
          }, {});
        doc["_xmlns:xsi"]="http://www.w3.org/2001/XMLSchema-instance";
        const xml = xmlify(doc, {root: 'kpivalues'}).replace(/(kpivalue\d*)/g, 'kpivalue');
        // console.log(xml)
        res.send(xml);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/kpivalues/:id/:period', /*authenticate,*/ (req, res) => {
    const KPI_ID = req.params.id;
    const Period = decodeURIComponent(req.params.period);
    kpivalue.find({KPI_ID, Period}).then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/kpivalues/:id/:period/:provider', /*authenticate,*/ (req, res) => {
    const KPI_ID = req.params.id;
    const Period = decodeURIComponent(req.params.period);
    const Provider = decodeURIComponent(req.params.provider);
    kpivalue.find({KPI_ID, Period, Provider}).then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.delete('/kpivalues/:id', /*authenticate,*/ (req, res) => {
    const KPI_ID = req.params.id;
    kpivalue.remove({KPI_ID}).then((count) => {
        res.send(count);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.delete('/kpivalues/:id/:period', /*authenticate,*/ (req, res) => {
    const KPI_ID = req.params.id;
    const Period = decodeURIComponent(req.params.period);
    kpivalue.remove({KPI_ID, Period}).then((count) => {
        res.send(count);
    }, (e) => {
        res.status(400).send(e);
    });
});

const getProviderCount = function (datasource, period) {
    return datasources[datasource].mongoModel.find({Period:period}).then(load => {
        return load[0].data.length
    })
}

//route for getting total records for each kpi and period combination
app.get('/kpitotals', /*authenticate,*/ (req, res) => {
    kpivalue.aggregate([
        {$group:{_id:{KPI_ID:"$KPI_ID",Period:"$Period"}, Total: {$sum:1}}},
        {$project:{KPI_ID:"$_id.KPI_ID", Period:"$_id.Period", Total:"$Total"}}
    ]).then(results => {
        let transposedData = [];
        const uniquePeriods = [...new Set(results.map(result => {
            return result.Period
        }))]

        const uniqueKpis = [...new Set(results.map(result => {
            return result.KPI_ID
        }))].sort((a,b) => {return a-b})

        uniqueKpis.forEach(kpi => {
            transposedData.push({KPI_ID: kpi});
        })

        transposedData.map(dataItem => {
            dataItem.datasource = kpis[`kpi_${dataItem.KPI_ID}`].datasource;
            dataItem.data = []
            uniquePeriods.forEach(period => {
                results.map(result => {
                    if (result.KPI_ID === dataItem.KPI_ID && result.Period === period && result.Total) {
                        // benchmarkAPI.findLoadByDatasourcePeriod(dataItem.datasource, period).then(response => {
                            dataItem.data.push({
                                Period: period,
                                KPI_Values: result.Total,
                                // Load_Providers: response.data.loads[0].data.length || "Error"
                            })
                        // })
                    }
                })
            })
            dataItem.data.sort((a,b) => {
                return moment(new Date(a.Period))-moment(new Date(b.Period))
            })
            dataItem.data.map(dataElement => {
                benchmarkAPI.findLoadByDatasourcePeriod(dataItem.datasource, dataElement.Period).then(response => {
                    if (response.data) {return dataElement.Load_Provider = response.data.loads[0].data.length}
                })
            })
        })
        res.send(transposedData)
    }, err => {
        res.status(400).send(err)
    })
})

//kpi collection routes
app.post('/kpis', /*authenticate,*/ (req, res) => {
    kpi.updateOne(
        {KPI_ID: req.body.KPI_ID},
        {$set: req.body},
        {upsert: true}
    ).then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/kpis', /*authenticate,*/ (req, res) => {
    // let datasource
    // if (typeof req.query.datasource !== 'undefined') {
    //     datasource = req.query.datasource;
    // }
    // kpi.find({datasource}).then((doc) => {
    kpi.find({}).then((doc) => {
        doc.sort((a,b) => {return a.KPI_ID - b.KPI_ID;})
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/kpis/:id', /*authenticate,*/ (req, res) => {
    const KPI_ID = req.params.id;
    kpi.find({KPI_ID}).then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.listen(port, () => {
    console.log(`Started on port ${port}`);
});

module.exports = {app};