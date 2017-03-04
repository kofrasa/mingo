
var gulp = require('gulp')
exec = require('child_process').exec

gulp.task('build', function (cb) {
  exec('make', function (err) {
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

gulp.task('watch', function () {
  gulp.watch('lib/**/*.js', ['build'])
  gulp.watch('test/*.js', ['test'])
})

gulp.task('default', ['watch'])
