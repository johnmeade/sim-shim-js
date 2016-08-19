var webpack = require('webpack');
var fs = require('fs');

// read envirnoment variable to enable / disable minification
var MINIFY = JSON.parse(process.env.MINIFY || '0');

// get licences string ready for appending
var LICS = fs.readFileSync('LICENSES.js').toString();


module.exports = {

  entry: {
    SimShimBundle: './src/index.js'
  },

  output: {
    path: './dist/',
    filename: MINIFY ? 'sim-shim-bundle.min.js' : 'sim-shim-bundle.js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'webpack-append',
        query: LICS
      }
    ]
  },

  plugins: MINIFY ? [
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } })
  ] : [],

  devtool: 'source-map',

  resolve: {
    // allow require('file') instead of require('file.js')
    extensions: ['', '.js', '.json']
  },

};
