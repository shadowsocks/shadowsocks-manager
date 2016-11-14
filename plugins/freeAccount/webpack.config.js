const path = require('path');
module.exports = {
  entry: './plugins/freeAccount/public/app.js',
  output: {
    path: path.resolve(__dirname, 'libs'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
};
