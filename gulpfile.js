
var gulp = require('gulp')
exec = require('child_process').exec

gulp.task('build', function (cb) {
  exec('npm run build', function (err) {
    if (err) return cb(err)
    cb()
  })
})

gulp.task('test', function (cb) {
  exec('npm test', function (err) {
    if (err) return cb(err)
    cb()
  })
})

gulp.task('watch', function () {
  gulp.watch('mingo.js', ['test'])
  gulp.watch('test/*.js', ['test'])
})

gulp.task('default', ['watch'])
