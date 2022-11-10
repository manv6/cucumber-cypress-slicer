#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('fs');
const Gherkin = require('gherkin');
const glob = require('glob');
const path = require('path');

const { writeFeatureFile } = require('./feature-files');
const {
  extractScenarios,
  getScenariosOfType,
  getFeatureTop
} = require('./features');


function writeSingleScenarioFile(dir, parsed, scenario) {
  let output = getFeatureTop(parsed);
  output += extractScenarios(scenario);
  return writeFeatureFile(dir, parsed, output);
}

function writeWholeFeatureFile(dir, parsedFeature) {
  let output = getFeatureTop(parsedFeature);
  let scenarios = getScenariosOfType(parsedFeature, 'Scenario');
  scenarios = scenarios.concat(getScenariosOfType(parsedFeature, 'ScenarioOutline'));
  output += extractScenarios(scenarios);
  return writeFeatureFile(dir, parsedFeature, output);
}

function splitFeatureFile(parsed, dir) {
  const featureLevelTags = parsed.feature.tags;

  const containsNoSplitTag = (item) => (item.name.toLowerCase() === '@nosplit');
  if (featureLevelTags && featureLevelTags.some(containsNoSplitTag))
    // don't split this one into individual scenarios
    return [writeWholeFeatureFile(dir, parsed)];


  return parsed.feature.children.filter(
    (child) => child.type === 'Scenario' || child.type === 'ScenarioOutline'
  ).map((child) => writeSingleScenarioFile(dir, parsed, [child]));
}

async function cucumberSlicer(featureFilesPath, splitDir) {
  const filesBefore = glob
    .sync(featureFilesPath)
    .map((file) => `${file}`);
  const parser = new Gherkin.Parser();
  let generatedFiles = [];
  filesBefore.forEach((file) => {
    console.log(path.dirname(file).replace('cypress/e2e/', ''));
    generatedFiles = generatedFiles.concat(
      splitFeatureFile(
        parser.parse(fs.readFileSync(file, 'utf8')),
        `${splitDir}${path.dirname(file).replace('cypress/e2e/', '')}`
      )
    );
  });
  return generatedFiles;
}

async function main() {
  console.log("Parsing feature files to split them!!!");
  if (process.argv[2] === "main")
    cucumberSlicer("cypress/e2e/**/*.feature", "cypress/e2e/parsed/");
}

main();

module.exports = { cucumberSlicer };
