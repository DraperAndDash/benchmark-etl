// const request = require('request');
const axios = require('axios');
// const http = require('http');

axios.defaults.baseURL = `http://localhost:${process.env.PORT}`;
axios.defaults.headers.post['Content-Type'] = 'application/json';
// axios.defaults.headers.common['Connection'] = 'keep-alive';
// axios.defaults.timeout = 0;

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

const findLoadByDatasourcePeriod = function(datasource, period) {
    period = encodeURIComponent(period);
    return axios.get(`/loads/${datasource}/period/${period}`)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        })
}

// KPIValue API functions
const postKPIValue = function(kpiValue) {
    // Attempt below with keepAlive set to true on the agent
    // This was supposed to fix Error: connect EADDRNOTAVAIL 127.0.0.1:8080 but it hasn't
    // return axios.post('/kpivalues', kpiValue, {httpAgent: new http.Agent({ keepAlive: true, maxSockets: 1})})
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

//getProviderCount - a count of the number of providers for each period in each datasource

module.exports = {
    postLoad, 
    getDatasourceLoads, 
    findLoadByDatasourceFilename,
    findKPIValuesByIDPeriodProvider,
    postKPIValue,
    postKPI,
    getKPIByID,
    findLoadByDatasourcePeriod
};