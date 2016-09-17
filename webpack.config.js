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
        loader: 'babel', // 'babel-loader' is also a legal name to reference
        query: {
          plugins: [
            'transform-es2015-template-literals',
            'transform-es2015-literals',
            'transform-es2015-function-name',
            'transform-es2015-arrow-functions',
            'transform-es2015-block-scoped-functions',
            'transform-es2015-classes',
            'transform-es2015-object-super',
            'transform-es2015-shorthand-properties',
            'transform-es2015-computed-properties',
            'transform-es2015-for-of',
            'transform-es2015-sticky-regex',
            'transform-es2015-unicode-regex',
            'check-es2015-constants',
            'transform-es2015-spread',
            'transform-es2015-parameters',
            'transform-es2015-destructuring',
            'transform-es2015-block-scoping',
            'transform-es2015-typeof-symbol',
            ['transform-regenerator', { async: false, asyncGenerators: false }],
            'lodash'
          ],
          // presets: ['es2015']
        }
      }
    ]
  },
  plugins: plugins
};

