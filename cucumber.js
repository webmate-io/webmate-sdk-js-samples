// cucumber.js
let common = [
    './src/cucumber',                       // Specify our feature files
    '--require-module ts-node/register',    // Load TypeScript module
    '--require ./src/cucumber/**/*.ts',     // Load step definitions
    '--format progress-bar',                // Load custom formatter
    '--publish-quiet'
].join(' ');

module.exports = {
    default: common
};
