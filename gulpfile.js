const del = require('del');
const gulp = require('gulp');
const path = require('path');
const webpackStream = require('webpack-stream');
const concat = require('gulp-concat');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const cleanCSS = require('gulp-clean-css');

gulp.task('clean', () => {
  return del([
    'plugins/webgui/libs/bundle.js',
    'plugins/webgui/libs/lib.js',
    'plugins/webgui/libs/style.css',
  ]);
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
    'plugins/webgui/public/**/*.js',
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
                      'last 3 versions'
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
    performance: { hints: false },
  }))
  .pipe(gulp.dest('plugins/webgui/libs'));
});

gulp.task('webguiCss', () => {
  return gulp.src([
    'plugins/webgui/public/styles/**/*.css',
  ])
  .pipe(cleanCSS({compatibility: '*'}))
  .pipe(concat('style.css'))
  .pipe(gulp.dest('plugins/webgui/libs'));
});

gulp.task('default', gulp.series('clean', gulp.parallel('webguiBuild', 'webguiLib', 'webguiCss')));
