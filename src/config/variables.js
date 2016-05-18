'use strict';

var deepExtend = require('deep-extend');
var path = require('path');
var chalk = require('chalk');

// This and anything in config.paths must be absolute.
var ROOT_PATH = path.resolve(__dirname, '../..');

var SOURCE_DIRNAME = 'src';
var WEB_ROOT_DIRNAME = 'public';
var ASSETS_DIRNAME = 'static';
var BUILD_DIRNAME = 'static/build';



var config = {
    publicPaths: {
        assets: '/' + ASSETS_DIRNAME + '/',
        build: '/' + BUILD_DIRNAME + '/'
    },
    paths: {
        root: ROOT_PATH,
        webRoot: path.join(ROOT_PATH, WEB_ROOT_DIRNAME),
        assets: path.join(ROOT_PATH, WEB_ROOT_DIRNAME, ASSETS_DIRNAME),
        build: path.join(ROOT_PATH, WEB_ROOT_DIRNAME, BUILD_DIRNAME), // Do not keep any non-generated files here.
        source: path.join(ROOT_PATH, SOURCE_DIRNAME),
        components: path.join(ROOT_PATH, SOURCE_DIRNAME, 'components'),
        serverViews: path.join(ROOT_PATH, SOURCE_DIRNAME, 'server-views')
    },
    server: {
        publicFiles: [
            'robots.txt',
            'favicon.ico'
        ],
        // rootUrl is overridden at bottom of file using data
        // in config.server (example format: http://example.com/)
        rootUrl: null
    },
    webpack: {
        // Webpack bundle filename
        outputFilename: '[name]-bundle-[hash].js',
        // Assets-webpack-plugin generates a JSON file containing actual
        // webpack bundle filenames on every webpack emit event.
        // To get the actual bundle filenames, use config/webpack-assets.js
        assetsFilename: 'webpack-assets.json',
        assetsPath: ROOT_PATH
    },
    vision: {
        viewsPath: 'views'
    }
};


if (process.env.NODE_ENV === 'development') {
    deepExtend(config, {
        server: {
            host: 'localhost',
            port: 3000,
            protocol: 'http'
        },
        webpack: {
            port: 3001
        }
    });

} else if (process.env.NODE_ENV === 'production') {
    deepExtend(config, {
        server: {
            host: 'localhost',
            port: 2000,
            protocol: 'http'
        }
    });

} else {
    var errorText = '[' + path.basename(__filename) + '] ERROR: NODE_ENV is not set: ' + process.env.NODE_ENV;
    console.log(chalk.red(errorText));
    throw new Error(errorText);
}


config.server.rootUrl = [
    config.server.protocol,
    '://',
    config.server.host,
    ':',
    config.server.port
].join('');


Object.freeze(config); // On a separate line because IntelliJ's JS code assistance is not very smart :(


module.exports = config;
