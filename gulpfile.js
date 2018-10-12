const del = require('del');
const gulp = require('gulp');
const path = require('path');
const babel = require('gulp-babel');
const webpackStream = require('webpack-stream');
const concat = require('gulp-concat');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

gulp.task('clean', () => {
  return del([
    'lib',
    'plugins/webgui/libs/bundle.js',
    'plugins/webgui/libs/lib.js',
  ]);
});

gulp.task('freeAccountCopy', () => {
  return gulp
    .src([
      'plugins/freeAccount/libs/**',
      'plugins/freeAccount/views/**',
    ], {
      base: './'
    })
    .pipe(gulp.dest('lib'));
});

gulp.task('webguiLib', () => {
  return gulp.src([
    'plugins/webgui/libs/jquery.min.js',
    'plugins/webgui/libs/angular.min.js',
    'plugins/webgui/libs/angular-inview.js',
    'plugins/webgui/libs/angular-animate.min.js',
    'plugins/webgui/libs/angular-aria.min.js',
    'plugins/webgui/libs/angular-messages.min.js',
    'plugins/webgui/libs/angular-material.min.js',
    'plugins/webgui/libs/angular-ui-router.min.js',
    'plugins/webgui/libs/angular-translate.min.js',
    'plugins/webgui/libs/qrcode.min.js',
    'plugins/webgui/libs/angular-qr.min.js',
    'plugins/webgui/libs/clipboard.min.js',
    'plugins/webgui/libs/ngclipboard.min.js',
    'plugins/webgui/libs/ngStorage.min.js',
    'plugins/webgui/libs/Chart.min.js',
    'plugins/webgui/libs/angular-chart.min.js',
    'plugins/webgui/libs/moment.min.js',
    'plugins/webgui/libs/angular-moment.min.js',
    'plugins/webgui/libs/angular-websocket.min.js',
    'plugins/webgui/libs/marked.min.js',
    'plugins/webgui/libs/angular-marked.min.js',
  ])
  .pipe(concat('lib.js'))
  .pipe(gulp.dest('plugins/webgui/libs'));
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
      rules: [{
        test: /\.js$/,
        use: [{
          loader: 'babel-loader',
          query: {
            presets: [
              [
                '@babel/env', {
                  targets: {
                    browsers: [
                      'Chrome >= 57',
                      'FireFox >= 50',
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
        
      }]
    },
    optimization: {
      minimizer: [new UglifyJsPlugin()],
    },
    mode: 'production',
  }))
  .pipe(gulp.dest('plugins/webgui/libs'));
});

gulp.task('webguiCopy', gulp.parallel('webguiBuild', 'webguiLib', () => {
  return gulp
    .src([
      'plugins/webgui/libs/**',
      'plugins/webgui/public/**',
      'plugins/webgui/views/**',
    ], {
      base: './'
    })
    .pipe(gulp.dest('lib'));
}));

gulp.task('babelCopy', () => {
  return gulp
    .src([
      'config/*.yml',
      'package.json',
    ], {
      base: './'
    })
    .pipe(gulp.dest('lib'));
});

gulp.task('babel', gulp.parallel('webguiCopy', 'freeAccountCopy', 'babelCopy', () => {
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
        '@babel/env', {
          targets: {
            node: '8.0'
          },
        }
      ]
    ],
  }))
  .pipe(gulp.dest('lib'));
}));

gulp.task('webguiWatch', function () {
  gulp.watch('plugins/webgui/public/**', ['webguiBuild']);
});

gulp.task('default', gulp.series('clean', 'babel'));