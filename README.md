# Benchmark ETL

## Overview

This application is part of the D&D Open Data project which includes scraping files from various healthcare online data sources, transforming and structuring them into querable data and finally creating a large source of performance indicators for analytical consumption.

THe application here is responsible for picking up downloaded files, transforming and loading the data into MongoDB and finally creating the data for the performance indicators and storing in a seperate MongoDB collection. This application also contains a REST API powered by Express that allows for extracting the data from anywhere.

## Datasources

Within the datasources folder there are a list of the current implemented datasources. Each one is a module that contains four exports; the mongoose model for loading it's data into MongoDB, a glob pattern for defining what files should be loaded, a regex pattern for having files loaded through file-watch.js and a process data function which defines the rules for how files should be transformed before being loaded into the collection. 

Datasources will have different structures from one another but all files in the same datasource should follow the same pattern. Although different datasource structures can differ they must have a Period property which contains the date the file relates to and a data array that stores the row level data for that file. Within the data array each element should have a Provider and Provider Code property. Not adhering these criteria will cause subsequent processes to fail.

## KPIs

These are indicators that are taken from the various datasource collections. A KPI belongs to a single datasource, must have a unique KPI ID and follow the exact same structure as all other KPIs. The calculated output is stored in the kpivalues collection and every KPI ID, Period and Provider Code combination should have an entry. There is also a KPI collection that acts as a reference table for all the KPIs, these have the ID and the names for each KPI.

## Deployment

The application is deployed on an AWS EC2 server and managed by PM2 and Crontab. PM2 runs two processes, index and file-watch. Index is the Express application and API for making requests to the database. THe file-watch task monitors the downloaded file directory ready to load in files as soon as they're downloaded. Crontab runs the wget scraper daily at midnight and also the etl-process.js file for a full daily etl run of the files and kpi values.

## Built With

* [PM2](https://github.com/Unitech/pm2) - Used to manage Node processes
* [Crontab](https://crontab.guru/) - Used to schedule tasks
* [SheetJS](https://github.com/SheetJS/js-xlsx) - Used to handle spread sheets
* [Mongoose](https://github.com/Automattic/mongoose) - MongoDB object modelling
* [Express](https://github.com/expressjs/express) - Web framework

## Authors

* **Graham Fletcher** - *Initial work*

sasasas