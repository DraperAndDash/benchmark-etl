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
const {KPIValue} = require('./models/KPIValue');

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
    const newKPIValue = new KPIValue(req.body);
    newKPIValue.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/kpivalues/:id/:period', /*authenticate,*/ (req, res) => {
    const id = req.params.id;
    const period = decodeURIComponent(req.params.period);
    KPIValue.find({KPI_ID: id, Period: period}).then((kpivalues) => {
        kpivalues.length === 0 && res.send({answer: false}) || res.send({answer: true});
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