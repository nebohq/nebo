const { readFileSync, writeFileSync } = require('fs');

const modifyPackage = (change, path = './package.json') => {
  const currentPackage = JSON.parse(readFileSync(path));
  Object.assign(currentPackage, change);
  writeFileSync(path, JSON.stringify(currentPackage, null, '  '));
};

module.exports = {
  modifyPackage,
};
