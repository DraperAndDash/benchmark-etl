// const request = require('request');
const axios = require('axios');

axios.defaults.baseURL = `http://localhost:${process.env.PORT}`;
axios.defaults.headers.post['Content-Type'] = 'application/json';

// const postLoad = function(port, datasource, callback) {
//     request({
//         url: `http://localhost:${port}/loads/${datasource}`,
//         json: true,
//         method: POST,
//         body: formattedMongoData
//     }, (error, response, body) => {
//         if (error) {
//             callback('Unable to connect to benchmarking data server.');
//         } else if (response.statusCode !== 200) {
//             callback('Something went wrong');
//         } else if (response.statusCode === 200) {
//             callback('Posted data load', body);
//         }
//     })
// }

const postLoad = function(datasource, dataLoad) {
    return axios.post(`/loads/${datasource}`, dataLoad)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        })
}

const getAll = function(datasource) {
    return axios.get(`/loads/${datasource}`)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        })
}

const findByFilename = function(datasource, filename) {
    return axios.get(`/loads/${datasource}/${filename}`)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        })
}

module.exports = {postLoad, getAll, findByFilename};