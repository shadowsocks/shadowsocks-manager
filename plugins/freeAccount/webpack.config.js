const path = require('path');
const webpack = require('webpack');
module.exports = {
  entry: './plugins/freeAccount/public/app.js',
  output: {
    path: path.resolve(__dirname, 'libs'),
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        },
      },
    ],
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    }),
  ],
};
