var gulp = require('gulp');

gulp.task('test', function (cb) {
  var
    mocha = require('gulp-mocha'),
    istanbul = require('gulp-istanbul');

  gulp
    .src('./index.js')
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      gulp.src('./test/test.js')
        .pipe(mocha())
        .pipe(istanbul.writeReports())
        .on('end', cb);
    });
});

gulp.task('coveralls', function (cb) {
  var coveralls = require('gulp-coveralls');

  gulp
    .src('./test/coverage/lcov.info')
    .pipe(coveralls());
});
