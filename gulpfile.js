var gulp = require('gulp');

var uglify = require('gulp-uglify');

gulp.task('default', function() {
    gulp.src('public/controllers/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('public/controllers-min')
    );
    gulp.src('public/routes/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('public/routes-min')
    );
});
