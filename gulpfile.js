
const gulp = require('gulp')
const exec = require('child_process').exec

gulp.task('build', function (cb) {
  // ensures prerequisite exists
  exec('make test', function (err) {
    if (err) return cb(err)
    cb()
  })
})

gulp.task('test', function (cb) {
  exec('tape test/*.js', function (err) {
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
