console.log('gulpfile');
var gulp = require('gulp');

var uglify = require('gulp-uglify');

gulp.task('js', function() {
    gulp.src('public/controllers/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('public/controllers-min')
    );
    gulp.src('public/routes/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('public/routes-min')
    );
});
gulp.start('js');
// // 在命令行使用 gulp auto 启动此任务
// gulp.task('auto', function () {
//     // 监听文件修改，当文件被修改则执行 script 任务
//     gulp.watch('js/*.js', ['script']);
// });


// // 使用 gulp.task('default') 定义默认任务
// // 在命令行使用 gulp 启动 script 任务和 auto 任务
// gulp.task('default', ['script', 'auto']);