/**
 * Created by francis on 3/27/15.
 */

var gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  plumber = require('gulp-plumber'),
  exec = require('child_process').exec;

gulp.task('build', function (cb) {
  exec("npm run-script build", function (err) {
    if (err) {
      return cb(err);
    }
    cb();
  })
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
  gulp.watch('mingo.js', ['build', 'test']);
  gulp.watch('test/*.js', ['test']);
});

gulp.task('default', ['watch']);