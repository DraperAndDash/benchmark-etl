// const request = require('request');
const axios = require('axios');

axios.defaults.baseURL = `http://localhost:${process.env.PORT}`;
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Load API functions
const postLoad = function(datasource, dataLoad) {
    return axios.post(`/loads/${datasource}`, dataLoad)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        })
}

const getDatasourceLoads = function(datasource) {
    return axios.get(`/loads/${datasource}`)
        .then(response => {
            return response.statusText === 'OK' && response.data.loads || response;
        })
        .catch(error => {
            return error;
        })
}
/* //This will return a very large payload
const getAll = function() {
    return axios.get(`/loads`)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        })
}*/

const findLoadByDatasourceFilename = function(datasource, filename) {
    filename = encodeURIComponent(filename);
    return axios.get(`/loads/${datasource}/${filename}`)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        })
}

// KPIValue API functions
const postKPIValue = function(kpiValue) {
    return axios.post('/kpivalues', kpiValue)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        })
}

const findKPIValuesByIDPeriod = function(id, period) {
    period = encodeURIComponent(period);
    return axios.get(`/kpivalues/${id}/${period}`)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        })
}

module.exports = {
    postLoad, 
    getDatasourceLoads, 
    findLoadByDatasourceFilename,
    findKPIValuesByIDPeriod,
    postKPIValue
};