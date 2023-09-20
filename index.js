#!/usr/bin/env node

const glob = require('glob');
const path = require('path');
const fs = require("fs");
const Gherkin = require("@cucumber/gherkin");
const Messages = require("@cucumber/messages");

const uuidFn = Messages.IdGenerator.uuid();
const builder = new Gherkin.AstBuilder(uuidFn);
const matcher = new Gherkin.GherkinClassicTokenMatcher(); // or Gherkin.GherkinInMarkdownTokenMatcher()

const parser = new Gherkin.Parser(builder, matcher);


class GherkinDocumentHandler {
  constructor(gherkinDocument) {
    this.gherkinDocument = gherkinDocument;
    this.feature = gherkinDocument.feature;
    this.generatedFiles = 0;
  }

  writeToFile(directory) {
    
    if (!fs.existsSync(directory))
      fs.mkdirSync(directory, { recursive: true })
    
    const feature = this.gherkinDocument.feature;
    // console.log("gherkin doc");
    let featureText = "";
    if (feature.tags.length > 0) {
      let tags = feature.tags.map((tag) => tag.name).join("\n");
      featureText += `${tags}\n`;
    }
    featureText += `Feature: ${feature.name}\n${feature.description}\n\n`;

    let featureBackground = "";
    feature.children.forEach((child, index) => {
      let featureBody = "";
      if (child.background) {
        // console.log("background");
        featureBackground = this.handleBackground(child.background);
      }
      if (child.scenario && child.scenario.keyword === "Scenario") {
        // console.log("scenario");
        featureBody = this.handleScenario(child.scenario);
        fs.writeFileSync(
          `${directory}/${feature.name.replace(
            /\s/g,
            "_"
          ).replace('/', '')}_${child.scenario.name
            .replace(/[^a-zA-Z ]/g, "")
            .replace(/\s/g, "_")}.feature`,
          featureText + featureBackground + featureBody
        );
        this.generatedFiles++;
      } else if (child.rule) {
        // console.log("rule");
        child.rule.children.forEach((ruleChild, ruleIndex) => {
          if (ruleChild.scenario && ruleChild.scenario.keyword === "Scenario") {
            // console.log("Rule scenario");
            featureBody = this.handleScenario(ruleChild.scenario);
            fs.writeFileSync(
              `${directory}/${feature.name.replace(
                /\s/g,
                "_"
              ).replace('/', '')}_${ruleChild.scenario.name
                .replace(/[^a-zA-Z ]/g, "")
                .replace(/\s/g, "_")}.feature`,
              featureText + featureBackground + featureBody
            );
            this.generatedFiles++;
          } else if (
            ruleChild.scenario &&
            ruleChild.scenario.keyword === "Scenario Outline"
          ) {
            // console.log("Rule scenario outline");
            featureBody = this.handleScenarioOutline(
              ruleChild.scenario,
              directory,
              featureText,
              featureBackground
            );
          }
        });
      } else if (
        child.scenario &&
        child.scenario.keyword === "Scenario Outline"
      ) {
        // console.log("scenario Outline");
        this.handleScenarioOutline(
          child.scenario,
          directory,
          featureText,
          featureBackground
        );
      }
    });
    return this.generatedFiles;
  }

  handleScenario(scenario) {
    let scenarioText = "";
    if (scenario.tags.length > 0) {
      let tags = scenario.tags.map((tag) => tag.name).join("\n");
      scenarioText += `${tags}\n`;
    }
    scenarioText += `Scenario: ${scenario.name}\n`;
    scenario.steps.forEach((step) => {
      scenarioText += `    ${step.keyword} ${step.text}\n`;
    });
    return scenarioText;
  }

  handleScenarioOutline(scenario, directory, featureText, featureBackground) {
    let scenarioTags = "";
    if (scenario.tags.length > 0) {
      let tags = scenario.tags.map((tag) => tag.name).join(" ");
      scenarioTags += `${tags}\n`;
    }

    if (scenario.examples.length > 0) {
      scenario.examples.forEach((example, index) => {
        this.handleExample(
          scenario,
          directory,
          featureText,
          featureBackground,
          scenarioTags,
          example,
          index
        );
      });
    }
  }

  handleExample(
    scenario,
    directory,
    featureText,
    featureBackground,
    scenarioTags,
    example,
    index
  ) {
    let exampleText = "";
    let nameText = "";
    const header = example.tableHeader.cells.map((cell) => cell.value);
    example.tableBody.forEach((row) => {
      exampleText = `Scenario: ${scenario.name} Example ${index + 1}\n`;
      const values = row.cells.map((cell) => cell.value);
      const params = header.reduce((obj, key, i) => {
        obj[key] = values[i];
        return obj;
      }, {});
      scenario.steps.forEach((step) => {
        let stepText = step.text;

        for (const key in params) {
          stepText = stepText.replace(`<${key}>`, params[key]);
          nameText += "_" + params[key];
        }
        exampleText += `    ${step.keyword} ${stepText}\n`;
      });
      fs.writeFileSync(
        `${directory}/${this.feature.name.replace(/\s/g, "_").replace('/', '').replace('\\', '')}_${scenario.name
          .replace(/[^a-zA-Z ]/g, "")
          .replace(/\s/g, "_")}_${index + 1}.feature`,
        featureText + featureBackground + scenarioTags + exampleText
      );
      this.generatedFiles++;
      index++;
    });
    exampleText = "";
    nameText = "";
  }

  handleBackground(background) {
    let scenarioText = "";
    scenarioText += `${background.keyword}: ${background.name}\n`;
    if (background.description) scenarioText += `${background.description}\n`;
    background.steps.forEach((step) => {
      scenarioText += `    ${step.keyword} ${step.text}\n`;
    });
    scenarioText += `\n`;
    return scenarioText;
  }
}

async function cucumberSlicer(featureFilesPath, splitDir) {
  let generatedFiles = 0;
  const filesBefore = glob
    .sync(featureFilesPath)
    .map((file) => `${file}`);
  
  filesBefore.forEach((file) => {
    const gherkinDocument = parser.parse(
      fs.readFileSync(file, "utf-8")
    );
    // console.log(`working on directory: ${path.dirname(file).replace('cypress/e2e/', '')}`);
    generatedFiles += new GherkinDocumentHandler(gherkinDocument).writeToFile(
      splitDir+path.dirname(file).replace('cypress/e2e/', '').replace('cypress/e2e', '')
    );
  });
  console.log(`${filesBefore.length} files parsed`)
  console.log(`${generatedFiles} files generated`)
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
