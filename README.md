# Benchmark ETL

## Overview

This application is part of the D&D Open Data project which includes scraping files from various healthcare online data sources, transforming and structuring them into querable data and finally creating a large source of performance indicators for analytical consumption.

THe application here is responsible for picking up downloaded files, transforming and loading the data into MongoDB and finally creating the data for the performance indicators and storing in a seperate MongoDB collection. This application also contains a REST API powered by Express that allows for extracting the data from anywhere.

## Datasources

Within the datasources folder there are a list of the current implemented datasources.

A list of them can be found here: [a relative link](/docs/datasources.md)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Graham Fletcher** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
* Inspiration
* etc
