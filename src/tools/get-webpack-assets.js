'use strict';
/* eslint-disable no-console */
const config = require('./../config/variables');
const path = require('path');

const assetsJsonPath = path.resolve(config.webpack.assetsPath, config.webpack.assetsFilename);

/**
 * @type {function}
 * @returns {object}
 */
let getWebpackAssets;
let assets;

if (process.env.NODE_ENV === 'production') {
  // Require the file only once for efficiency
  // Note: like with any other require, you need to restart the server when that file changes
  assets = require(assetsJsonPath);

  getWebpackAssets = () => {
    return assets;
  };
} else {
  const fs = require('fs');
  const chalk = require('chalk');

  getWebpackAssets = () => {
    try {
      const fileContents = fs.readFileSync(assetsJsonPath).toString();
      return JSON.parse(fileContents);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log(chalk.yellow('WAIT: ' + config.webpack.assetsFilename + ' not found - webpack may still be compiling'));
        return { runtime: {}, vendors: {}, app: {} };
      }
      console.log(chalk.red('ERROR: Could not parse ' + config.webpack.assetsFilename + ' - maybe webpack is still processing?'));
      throw err;
    }
  };
}

module.exports = getWebpackAssets;
