const del = require('del');
const gulp = require('gulp');
const path = require('path');
const babel = require('gulp-babel');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');

gulp.task('clean', () => {
  return del([
    'lib',
    'plugins/freeAccount/libs/bundle.js',
  ]);
});

gulp.task('freeAccountBuild', () => {
  return gulp.src([
    'plugins/freeAccount/public/**',
  ])
  .pipe(webpackStream({
    entry: './plugins/freeAccount/public/app.js',
    output: {
      path: path.resolve(__dirname, 'libs'),
      filename: 'bundle.js'
    },
    module: {
      loaders: [{
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }]
    },
    plugins: [new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })]
  }))
  .pipe(gulp.dest('plugins/freeAccount/libs'));
});

gulp.task('freeAccount', ['freeAccountBuild'], () => {
  return gulp
    .src([
      'config/default.yml',
      'package.json',
      'plugins/freeAccount/libs/**',
      'plugins/freeAccount/public/**',
    ], {
      base: './'
    })
    .pipe(gulp.dest('lib'));
});

gulp.task('babel', ['freeAccount'], () => {
  return gulp.src([
    '**/*.js',
    '!node_modules/**',
    '!lib/**',
    '!plugins/freeAccount/libs/**',
    '!plugins/freeAccount/public/**',
  ])
  .pipe(babel({
    presets: ['stage-3'],
  }))
  .pipe(gulp.dest('lib'));
});

gulp.task('default', ['clean', 'babel'], () => {

});
