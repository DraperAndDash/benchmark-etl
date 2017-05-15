require('./config/config');

// const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} =require('mongodb');
const moment = require('moment');
const glob = require('glob-all');

var {mongoose} = require('./db/mongoose');
// var {User} = require('./models/user');
// var {authenticate} = require('./middleware/authenticate');

const datasources = require('./datasources/');
const kpis = require('./kpis/');
const {kpivalue} = require('./models/kpi-value');
const {kpi} = require('./models/kpi');

const datasourceListGlobPattern = [
  './datasources/*.js',
  '!./datasources/index.js'
];
const kpiListGlobPattern = [
  './kpis/kpi_*.js'
];
const datasourceList = glob.sync(datasourceListGlobPattern);
const kpiList = glob.sync(kpiListGlobPattern);

const formatPeriod = (period) => {
    return period.substring(6) + period.substring(3,5) + period.substring(0,2)
}

var app = express();
const port = process.env.PORT;

app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb'}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, x-auth, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "PATCH");
  next();
});

//Load routes
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

// CHANGING TO RETURN A LIST OF FILES THAT ARE LOADED
// API TIMING OUT AND NOT SENDING ANYTHING BACK WHEN TOO MANY LOADS EXIST
// app.get('/loads/:datasource', /*authenticate,*/ (req, res) => {
//     const datasource = req.params.datasource;
//     datasources[datasource].mongoModel.find({}).then((loads) => {
//         // res.setHeader('Content-Length', Buffer.byteLength())
//         res.send({loads});
//     }, (e) => {
//         res.status(400).send(e);
//     });
// });
app.get('/loads/:datasource', /*authenticate,*/ (req, res) => {
    const datasource = req.params.datasource;
    if (!datasources[datasource]) {
        res.status(400).send({error: "DATASOURCE NOT EXIST"})
    }
    datasources[datasource].mongoModel.find({}, {Period:1, filename:1}).then((loads) => {
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

//KPIValue routes
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
    kpivalue.find({}).then((doc) => {
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
        // console.log(load)
        return load[0].data.length
    })
}

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
            dataItem.data = {}
            uniquePeriods.forEach(period => {
                results.map(result => {
                    if (result.KPI_ID === dataItem.KPI_ID && result.Period === period && result.Total) {
                        dataItem.data[period] = result.Total
                        // dataItem[`${period} Providers`] = getProviderCount(dataItem.datasource, period)
                    }
                })
            })
        })
        transposedData.data.sort((a,b) => {
            return moment(a)-moment(b)
        })
        res.send(transposedData)
    }, err => {
        res.status(400).send(err)
    })
})



//KPIs routes
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

// app.get('/todos/:id', /*authenticate,*/ (req, res) => {
//     var id = req.params.id;

//     if (!ObjectID.isValid(id)) {
//         return res.status(404).send();
//     }
    
//     Todo.findOne({
//         _id: id,
//         _creator: req.user._id
//     }).then((todo) => {
//         if (!todo) {
//             return res.status(404).send();
//         }
//         res.send({todo});
//     }).catch((e) => {
//         res.status(400).send();
//     });
// });

// app.delete('/todos/:id', /*authenticate,*/ (req, res) => {
//     var id = req.params.id;

//     if (!ObjectID.isValid(id)) {
//         return res.status(404).send();
//     }

//     Todo.findOneAndRemove({
//         _id: id,
//         _creator: req.user._id
//     }).then((todo) => {
//         if (!todo) {
//             return res.status(404).send();
//         }
//         res.send({todo});
//     }).catch((e) => {
//         res.status(400).send();
//     });
// });

// app.patch('/todos/:id', /*authenticate,*/ (req, res) => {
//     var id = req.params.id;
//     var body = _.pick(req.body, ['title', 'text', 'completed']);

//     if (!ObjectID.isValid(id)) {
//         return res.status(404).send();
//     }

//     if (_.isBoolean(body.completed) && body.completed) {
//         body.completedAt = new Date().getTime();
//     } else {
//         body.completed = false;
//         body.completedAt = null;
//     }

//     Todo.findOneAndUpdate({
//         _id: id,
//         _creator: req.user._id
//     },{$set: body}, {new: true}).then((todo) => {
//         if(!todo) {
//             return res.status(404).send();
//         }

//         res.send({todo});
//     }).catch((e) => {
//         res.status(400).send();
//     });
// });

/* USER routes */
// app.post('/users', (req, res) => {
//     var body = _.pick(req.body, ['email', 'password']);
//     var user = new User(body);

//     user.save().then(() => {
//         return user.generateAuthToken();
//     }).then((token) => {
//         res.header('x-auth', token).send(user);
//     }).catch((e) => {
//         res.status(400).send(e);
//     });
// });

// app.get('/users/me', authenticate, (req, res) => {
//     res.send(req.user);
// });

// app.post('/users/login', (req, res) => {
//     var body = _.pick(req.body, ['email', 'password']);
    
//     User.findByCredentials(body.email, body.password).then((user) => {
//         return user.generateAuthToken().then((token) => {
//             res.header('x-auth', token).send(user);
//         });
//     }).catch((e) => {
//         res.status(400).send();
//     });
// });

// app.delete('/users/me/token', authenticate, (req, res) => {
//     req.user.removeToken(req.token).then(() => {
//         res.status(200).send();
//     }, () => {
//         res.status(400).send();
//     });
// });

app.listen(port, () => {
    console.log(`Started on port ${port}`);
});

module.exports = {app};