#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');
const path = require('path');

function splitScenarios(featureFileContent, savePath) {
  if (!fs.existsSync(savePath))
    fs.mkdirSync(savePath, { recursive: true });
  
  const featureRegex = /((@.+\n)+)?Feature:\s(.+)\n/;
  const featureMatch = featureRegex.exec(featureFileContent);
  const featureTags = featureMatch[1] ? featureMatch[1].trim() : '';
  const featureTitle = featureMatch[3].replace(/ /g, '_'); // Replace spaces with underscores for file name

  const scenarioRegex = /((@.+\n)+)?Scenario( Outline)?:\s(.+)((.|\n)+?)(?=((@.+\n)+)?Scenario( Outline)?:\s|$)/g;

  let scenarioMatch;
  let counter = 0;

  while ((scenarioMatch = scenarioRegex.exec(featureFileContent)) !== null) {
    let tags = '';
    let tagMatch;
    let tagRegex = /@.+/g;
    while ((tagMatch = tagRegex.exec(scenarioMatch[0])) !== null) {
      tags += tagMatch[0] + '\n';
    }
    tags = tags.trim();

    let scenarioType = scenarioMatch[3] ? scenarioMatch[3].trim() : '';
    let scenarioName = scenarioMatch[4].trim();
    let scenarioContent = scenarioMatch[5];

    // Merge feature and scenario tags
    tags = [featureTags, tags].filter(Boolean).join('\n');

    if (scenarioType.toLowerCase() === 'outline') {
      const examplesRegex = /Examples:\s*\n\s*\|(.+)\|\s*\n((?:\s*\|.+(?:\n|$))+(?:\s*#.+)+((\s*\|.+|\n)+)?)/g;
      let examplesMatch = examplesRegex.exec(scenarioContent);

      if (examplesMatch) {
        let headers = examplesMatch[1]
        .trim()
        .split("|")
        .map((header) => header.trim());

      let valuesBlock = examplesMatch[2].trim();
      let valuesRows = valuesBlock.split("\n");
      let values = [];
      for (let row of valuesRows) {
        let trimmedRow = row.trim();
        // Ignore rows that start with a comment symbol #
        if (trimmedRow && !trimmedRow.startsWith("#")) {
          let rowValues = trimmedRow
            .split("|")
            .filter((item) => item !== ""); // Exclude empty values
          
          values.push(rowValues);
        }
      }
      console.log(values)
      values.forEach((value) => {
        if (value) {
          
          let valuesArr = value//.split("|").filter(element => element);
          let replacedScenarioContent = scenarioContent;
          headers.forEach((header, index) => {
              console.log(header)
              console.log(valuesArr[index])
            let regex = new RegExp("<" + header + ">", "g");
            replacedScenarioContent = replacedScenarioContent.replace(
              regex,
              valuesArr[index].trim()
            );
          });
            let newScenarioName = `${scenarioName} ${valuesArr}`.replace(/\s+/g, ' ').trim();
            let newScenarioContent = replacedScenarioContent.replace(
              /Scenario Outline:/,
              'Scenario:'
            ).replace(examplesRegex, '');

            fs.writeFileSync(
              path.join(__dirname, savePath,  `${featureTitle.replace(/\s/g, '_')}_${newScenarioName.replace(/[^a-zA-Z ]/g, '')
              .replace(/\s/g, '_')}.feature`),
              `${tags}\nFeature: Test Feature\n\nScenario: ${newScenarioName}${newScenarioContent}`
            );
          }
        });
      }
    } else {
      fs.writeFileSync(
        path.join(__dirname, savePath, `${featureTitle.replace(/\s/g, '_')}_${scenarioName.replace(/[^a-zA-Z ]/g, '')
        .replace(/\s/g, '_')}.feature`),
        `${tags}\nFeature: Test Feature\n\nScenario: ${scenarioName}${scenarioContent}`
      );
    }
  }
}

async function cucumberSlicer(featureFilesPath, splitDir) {
  const filesBefore = glob
    .sync(featureFilesPath)
    .map((file) => `${file}`);
  // const parser = new Gherkin.Parser();
  let generatedFiles = [];
  filesBefore.forEach((file) => {
    console.log(`working on directory: ${path.dirname(file).replace('cypress/e2e/', '')}`);
      splitScenarios(
        fs.readFileSync(file, 'utf8'),
        `${splitDir}/${path.dirname(file).replace('cypress/e2e/', '')}`)
  });
  return generatedFiles;
}

async function main() {
  if (process.argv[2] === "main"){
    console.log("Parsing feature files to split them!!!");
    cucumberSlicer("cypress/e2e/**/*.feature", "cypress/e2e/parsed/");
  }
}

main();

module.exports = { cucumberSlicer };
