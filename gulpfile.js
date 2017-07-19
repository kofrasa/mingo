
const gulp = require('gulp')
const rollup = require('rollup')
const exec = require('child_process').exec

gulp.task('build', function (cb) {
  exec('./compile.sh cjs', function (err) {
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
  gulp.watch('lib/**/*.js', ['build', 'test'])
  gulp.watch('test/*.js', ['test'])
})

gulp.task('default', ['watch'])
