/* eslint-disable no-console */
const fs = require('fs');

function writeFeatureFile(dir, parsed, content) {
  let scenarioName = '';
  let featureName = '';
  if (!fs.existsSync(dir))
    fs.mkdirSync(dir, { recursive: true });

  content.split('\n').forEach((line) => {
    if (line.includes('Scenario'))
      scenarioName = line;
    if (line.includes('Feature:'))
      featureName = line;
  });


  // const featureTags = parsed.feature.tags;
  const directory = `${dir}`; // (featureTags.length ? `/${featureTags[0].name.toLowerCase().slice(1)}/` : '/');
  if (!fs.existsSync(directory))
    fs.mkdirSync(directory);

  // eslint-disable-next-line max-len
  const filename = `${dir}/${featureName.replace(/\s/g, '_')}-${scenarioName.replace('.', '').replace('/', '_').replace(/'/g, '').replace(/\s/g, '_')}.feature`;
  fs.writeFileSync(filename, content);
  return filename;
}

module.exports = {
  writeFeatureFile,
};
