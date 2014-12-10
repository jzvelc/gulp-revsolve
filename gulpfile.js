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

gulp.task('clean', function (cb) {
  require('rmdir-recursive').sync('./coverage');
  cb();
});
