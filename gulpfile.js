
const gulp = require('gulp')
const rollup = require('rollup')
const exec = require('child_process').exec

gulp.task('build', function (cb) {
  exec('make build', function (err) {
    if (err) return cb(err)
    cb()
  })
})

gulp.task('test', function (cb) {
  exec('make test', function (err) {
    if (err) return cb(err)
    cb()
  })
})

gulp.task('version', function (cb) {
  exec('make version', function (err) {
    if (err) return cb(err)
    cb()
  })
})

gulp.task('watch', function () {
  gulp.watch('lib/**/*.js', ['build'])
  gulp.watch('test/*.js', ['test'])
  gulp.watch('VERSION', ['version'])
})

gulp.task('default', ['watch'])
