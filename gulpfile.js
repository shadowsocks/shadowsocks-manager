const del = require('del');
const gulp = require('gulp');
const path = require('path');
const babel = require('gulp-babel');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');

gulp.task('clean', () => {
  return del([
    'lib',
    'plugins/webgui/libs/bundle.js',
  ]);
});

gulp.task('freeAccountCopy', ['clean'], () => {
  return gulp
    .src([
      'plugins/freeAccount/libs/**',
      'plugins/freeAccount/views/**',
    ], {
      base: './'
    })
    .pipe(gulp.dest('lib'));
});

gulp.task('webguiBuild', () => {
  return gulp.src([
    'plugins/webgui/public/**',
  ])
  .pipe(webpackStream({
    entry: './plugins/webgui/public/app.js',
    output: {
      path: path.resolve(__dirname, 'libs'),
      filename: 'bundle.js'
    },
    externals: [
      {
        window: 'window'
      }
    ],
    module: {
      loaders: [{
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: [
            [
              'env', {
                targets: {
                  browsers: [
                    'Chrome >= 53',
                    'FireFox >= 44',
                    'Safari >= 7',
                    'ie >= 9',
                    'last 4 Edge versions'
                  ]
                }
              }
            ]
          ]
        }
      }]
    },
    plugins: [ new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }) ]
  }))
  .pipe(gulp.dest('plugins/webgui/libs'));
});

gulp.task('webguiCopy', ['webguiBuild'], () => {
  return gulp
    .src([
      'plugins/webgui/libs/**',
      'plugins/webgui/public/**',
      'plugins/webgui/views/**',
    ], {
      base: './'
    })
    .pipe(gulp.dest('lib'));
});

gulp.task('babelCopy', ['clean'], () => {
  return gulp
    .src([
      'config/*.yml',
      'package.json',
    ], {
      base: './'
    })
    .pipe(gulp.dest('lib'));
});

gulp.task('babel', ['webguiCopy', 'freeAccountCopy', 'babelCopy'], () => {
  return gulp.src([
    '**/*.js',
    '!node_modules/**',
    '!lib/**',
    '!plugins/freeAccount/libs/**',
    '!plugins/webgui/libs/**',
    '!plugins/webgui/public/**',
  ])
  .pipe(babel({
    presets: [
      [
        'env', {
          targets: {
            node: '6.0'
          },
        }
      ]
    ],
  }))
  .pipe(gulp.dest('lib'));
});

gulp.task('webguiWatch', function () {
  gulp.watch('plugins/webgui/public/**', ['webguiBuild']);
});

gulp.task('default', ['clean', 'babel'], () => {

});