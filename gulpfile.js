const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('default', () =>
  gulp.src([
    '**/*.js',
    '!node_modules/**',
    '!lib/**',
    '!plugins/freeAccount/libs/**',
    '!plugins/freeAccount/public/**',
  ])
  .pipe(babel({
    presets: ['stage-3'],
  }))
  .pipe(gulp.dest('lib'))
);

gulp.task('copy', function () {
  gulp
    .src([
      'package.json',
      'plugins/freeAccount/libs/**',
      'plugins/freeAccount/public/**',
    ])
    .pipe(gulp.dest('lib'));
});
