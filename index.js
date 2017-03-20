require('./config/config');

// const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} =require('mongodb');
// const bcrypt = require('bcryptjs');

var {mongoose} = require('./db/mongoose');
// var {User} = require('./models/user');
// var {authenticate} = require('./middleware/authenticate');

const datasources = require('./datasources/');
const {kpivalue} = require('./models/kpi-value');
const {kpi} = require('./models/kpi');

var app = express();
const port = process.env.PORT;

app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb'}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, x-auth, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "PATCH");
  next();
});

//Load routes
app.post('/loads/:datasource', /*authenticate,*/ (req, res) => {
    const datasource = req.params.datasource;
    const newLoad = new datasources[datasource].mongoModel(req.body);
    // Check provided datasource exists and send appropriate error if it doesn't

    newLoad.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/loads/:datasource', /*authenticate,*/ (req, res) => {
    const datasource = req.params.datasource;
    datasources[datasource].mongoModel.find({}).then((loads) => {
        res.send({loads});
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/loads/:datasource/:filename', /*authenticate,*/ (req, res) => {
    const datasource = req.params.datasource;
    const filename = decodeURIComponent(req.params.filename);
    datasources[datasource].mongoModel.find({filename: filename}).then((loads) => {
        res.send({loads});
    }, (e) => {
        res.status(400).send(e);
    });
});

//KPIValue routes
app.post('/kpivalues', /*authenticate,*/ (req, res) => {
    const newKPIValue = new kpivalue(req.body);
    newKPIValue.save().then((doc) => {
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

app.get('/kpivalues/:id/:period/:provider', /*authenticate,*/ (req, res) => {
    const KPI_ID = req.params.id;
    const Period = decodeURIComponent(req.params.period);
    const Provider = decodeURIComponent(req.params.provider);
    kpivalue.find({KPI_ID, Period, Provider}).then((doc) => {
        // kpivalues.length === 0 && res.send(false) || res.send(true);
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

// app.get('/kpitotals', /*authenticate,*/ (req, res) => {
//     kpivalue.distinct("Period").then((periods) => {
//         let kpiTotals = [];
//         periods.map(period => {
//             const kpi_1 = kpivalue.find({KPI_ID:1, Period:period}).then(doc => {return doc});
//             kpiTotals.push({
//                 Period: period,
//                 KPI_1: kpi_1,
//                 KPI_2: kpivalue.find({KPI_ID:2, Period:period}).then(doc => {return doc}),
//                 KPI_3: kpivalue.find({KPI_ID:3, Period:period}).then(doc => {return doc}),
//                 KPI_4: kpivalue.find({KPI_ID:4, Period:period}).then(doc => {return doc}),
//                 KPI_5: kpivalue.find({KPI_ID:5, Period:period}).then(doc => {return doc}),
//                 KPI_6: kpivalue.find({KPI_ID:6, Period:period}).then(doc => {return doc}),
//             })
//         })
//         res.send(kpiTotals);
//     }, (e) => {
//         res.status(400).send(e);
//     });
// });

//KPIs routes
app.get('/kpis', /*authenticate,*/ (req, res) => {
    kpi.find({}).then((doc) => {
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