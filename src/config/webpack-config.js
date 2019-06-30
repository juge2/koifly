'use strict';

const path = require('path');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge'); // concatenates arrays for the same key instead of replacing the first array
const AssetsWebpackPlugin = require('assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const config = require('./variables');

const APP_ENTRY = path.join(config.paths.source, 'main-app');
const HOME_ENTRY = path.join(config.paths.components, 'home-page/home');
const WEBPACK_HOT_ENTRY = 'webpack-hot-middleware/client?path=' + config.webpack.devServerUrl + '/__webpack_hmr';


let webpackConfig = {
  mode: 'none',
  entry: {
    app: APP_ENTRY,
    home: HOME_ENTRY
  },
  resolve: {
    // Webpack tries appending these extensions when you import your modules
    extensions: ['.js', '.jsx']
  },
  output: {
    publicPath: config.publicPaths.build, // Expose bundles in this web directory (Note: only dev server uses this option)
    filename: config.webpack.outputFilename, // Bundle filename pattern
    path: config.paths.build  // Put bundle files in this directory (Note: dev server does not generate bundle files)
  },
  module: {
    rules: [
      {
        test: /\.less$/,
        include: config.paths.source,
        // loaders are processed from the bottom up
        use: [
          // Use MiniCssExtractPlugin.loader instead of "style-loader"
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: config.paths.assets,
              hmr: process.env.NODE_ENV === 'development',
            },
          },
          'css-loader',
          'less-loader'
        ]
      },
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        include: config.paths.source,
      }
    ]
  },
  // TODO check that optimizations are working
  // optimization: {
  //   runtimeChunk: 'single',
  //   splitChunks: {
  //     cacheGroups: {
  //       vendor: {
  //         test: /[\\/]node_modules[\\/]/,
  //         name: 'vendors',
  //         chunks: 'all'
  //       }
  //     }
  //   }
  // },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'BROWSER': JSON.stringify(true) // is used for testing to prevent import css modules into testing env
      }
    }),
    new AssetsWebpackPlugin({
      filename: config.webpack.assetsFilename,
      path: config.webpack.assetsPath,
      prettyPrint: true
    }),
    new MiniCssExtractPlugin({
      filename: config.webpack.stylesFilename
    })
  ]
};


if (process.env.NODE_ENV === 'development') {

  webpackConfig = webpackMerge(webpackConfig, {
    mode: 'development',
    entry: {
      app: [APP_ENTRY, WEBPACK_HOT_ENTRY],
      sandbox: [path.join(config.paths.source, 'main-sandbox'), WEBPACK_HOT_ENTRY]
    },
    devtool: 'cheap-module-eval-source-map', // Generate source maps (more or less efficiently)
    module: {
      rules: [
        {
          enforce: 'pre', // Lint all JS files before compiling the bundles (see .eslintrc for rules)
          test: /\.(js|jsx)$/,
          loader: 'eslint-loader',
          include: config.paths.source,
          options: {
            emitError: true,
            emitWarning: true,
            failOnError: true
          }
        }
      ]
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(), // Enables HMR. Adds webpack/hot/dev-server entry point if hot=true
    ]
  });

} else if (process.env.NODE_ENV === 'production') {

  /** @lends webpackConfig */
  webpackConfig = webpackMerge(webpackConfig, {
    mode: 'production',
    devtool: 'source-map', // generate full source maps
    plugins: [
      new webpack.HashedModuleIdsPlugin() // bundle name hash will be based on the relative path thus enable browser caching
    ]
  });
}


module.exports = webpackConfig;
