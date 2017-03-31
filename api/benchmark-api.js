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
            return response;
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

const findKPIValuesByIDPeriodProvider = function(id, period, provider) {
    period = encodeURIComponent(period);
    provider = encodeURIComponent(provider);
    return axios.get(`/kpivalues/${id}/${period}/${provider}`)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        })
}

// KPIs API functions
const postKPI = function(kpi) {
    return axios.post('/kpis', kpi)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        })
}

const getKPIByID = function(id) {
    return axios.get(`/kpis/${id}`)
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
    findKPIValuesByIDPeriodProvider,
    postKPIValue,
    postKPI,
    getKPIByID
};