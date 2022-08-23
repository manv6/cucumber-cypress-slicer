function extractTags(tags) {
  let result = '';
  const tagNames = tags.map((tag) => tag.name);
  if (tagNames.length)
    result = `${tagNames.join(' ')}\n`;

  return result;
}

function extractExample(table) {
  let result = '';
  const header = table.tableHeader;
  const headerCells = header.cells.map((cell) => cell.value);
  result += ` | ${headerCells.join(' | ')} |\n`;
  const body = table.tableBody;
  const rows = body.map((row) => {
    const values = row.cells.map((cell) => cell.value);
    return ` | ${values.join(' | ')} |\n`;
  });
  result += rows.join('');
  return result;
}

function extractDataTableArgument(argument) {
  if (!argument) return '';

  const rows = argument.rows.map((row) => {
    const values = row.cells.map((cell) => cell.value);
    return `  | ${values.join(' | ')} |\n`;
  });
  return rows.join('');
}

function extractScenarios(scenarios) {
  let result = '';
  scenarios.forEach((scenario) => {
    const child = scenario;
    if (child.tags && child.tags.length)
      result += extractTags(child.tags);

    const keyword = child.keyword ? child.keyword : child.type;
    result += `${keyword}: ${child.name}\n`;
    const { steps } = child;
    for (let step = 0; step < steps.length; step++) {
      result += `  ${steps[step].keyword.trim()} ${steps[step].text.trim()}\n`;
      result += extractDataTableArgument(steps[step].argument);
    }
    const examples = child.examples ? child.examples : [];
    for (let eg = 0; eg < examples.length; eg++) {
      result += 'Examples:\n';
      result += extractExample(examples[eg]);
    }
    result += '\n';
  });
  return result;
}

function getScenariosOfType(parsed, type) {
  return parsed.feature.children.filter((child) => child.type === type);
}

function getFeatureTop(parsed) {
  const featureLevelTags = parsed.feature.tags;
  const featureTitle = parsed.feature.name;
  const background = getScenariosOfType(parsed, 'Background');
  let output = '';
  if (featureLevelTags.length)
    output += extractTags(featureLevelTags);

  output += `Feature: ${featureTitle}\n\n`;
  if (background.length)
    output += extractScenarios(background);

  return output;
}

module.exports = {
  extractTags,
  extractScenarios,
  getScenariosOfType,
  getFeatureTop,
};
