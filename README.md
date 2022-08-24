# cucumber-cypress-slicer [![renovate-app badge][renovate-badge]][renovate-app] ![cypress version](https://img.shields.io/badge/cypress-10.3.1-brightgreen)

> A cypress plugin for slice down feature files per scenario 

## Install

```shell
npm i -D cucumber-cypress-slicer
# or using Yarn
yarn add -D cucumber-cypress-slicer
```

This module assumes the `cypress` dependency v10.3.0+ has been installed.

## Use

```shell
npx cucumber-cypress-slicer
```
Which will find all features files and will create feature file for each scenario in `cypress/e2e/parsed/` folder.

## Naming 

Plugin will automatically create a feature file per scenario found and will name each file using the following pattern: 

```shell
Feature_<feature file title>_<scenario_title>.feature 
```
## Debugging

Run this script with environment variable `DEBUG=cucumber-cypress-slicer` to see verbose logs


[renovate-badge]: https://img.shields.io/badge/renovate-app-blue.svg
[renovate-app]: https://renovateapp.com/