// To build for release: NODE_ENV=production npm run build

const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const webpack = require('webpack');

const plugins = [];
const env     = process.env.NODE_ENV;

var suffix = '.js';

plugins.push(new LodashModuleReplacementPlugin());
plugins.push(new webpack.optimize.OccurrenceOrderPlugin());

if (env === 'production') {
  suffix = '.min.js';
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    mangle: {
      except: ['mingo', 'exports', 'require']
    }
  }));
}

module.exports = {
  entry: './mingo.js',
  output: {
    path: __dirname + '/dist',
    filename: 'mingo' + suffix,
    library: 'mingo',
    // umdNamedDefine: false,
    // libraryTarget: 'umd',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          plugins: [
            'lodash'
          ],
          presets: ['es2015']
        }
      }
    ]
  },
  plugins: plugins
};

