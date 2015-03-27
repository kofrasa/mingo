/**
 * Created by francis on 3/27/15.
 */

var gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  plumber = require('gulp-plumber'),
  exec = require('child_process').exec;

gulp.task('build', function () {
  gulp.src('mingo.js')
    .pipe(plumber())
    .pipe(uglify())
    .pipe(rename('mingo.min.js'))
    .pipe(gulp.dest('.'));
});

gulp.task('test', function (cb) {
  exec("npm test", function (err) {
    if (err) {
      return cb(err);
    }
    cb();
  })
});

gulp.task('watch', function (){
  gulp.watch('mingo.js', ['build']);
  gulp.watch('test/*.js', ['test']);
});

gulp.task('default', ['watch']);