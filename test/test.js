'use strict';

var
  fs = require('fs'),
  path = require('path'),
  gulp = require('gulp'),
  describe = require('mocha').describe,
  beforeEach = require('mocha').beforeEach,
  after = require('mocha').after,
  es = require('event-stream'),
  it = require('mocha').it,
  expect = require('chai').expect,
  assert = require('chai').assert,
  gutil = require('gulp-util'),
  through = require('through2'),
  revsolve = require('../');

require('chai').use(require('chai-fs'));

var contents = {};
function content(file) {
  if (!contents[file]) {
    contents[file] = fs.readFileSync(path.resolve(file), { encoding: 'utf8' });
  }
  return contents[file];
}

function input(fp) {
  if (!fp) {
    return './test/input';
  }
  return './test/input/' + fp;
}

function output(fp) {
  if (!fp) {
    return './test/output';
  }
  return './test/output/' + fp;
}

function fixture(fp) {
  if (!fp) {
    return './test/fixtures';
  }
  return './test/fixtures/' + fp;
}

describe('gulp-revsolve', function () {
  beforeEach(function (done) {
    require('rmdir-recursive').sync(output());
    done();
  });

  after(function (done) {
    require('rmdir-recursive').sync(output());
    done();
  });

  it('should fail with stream', function (cb) {
    var stream = revsolve();
    stream.on('error', function (err) {
      expect(err.message).to.equal('Streaming is not supported');
      cb();
    });
    stream.write(new gutil.File({
      path: 'unicorn.css',
      contents: through()
    }));
  });

  it('should pass null file', function (cb) {
    var stream = revsolve();
    var file = new gutil.File({
      path: 'unicorn.css',
      contents: null
    });

    stream.on('data', function (f) {
      expect(f).to.equal(file);
      cb();
    });

    stream.write(file);
  });

  it('should skip unmentioned files', function (cb) {
    gulp
      .src([input('styles/style.css'), input('images/*.*'),
        input('fonts/*.*')], { base: input() })
      .pipe(revsolve({ skipUnmentioned: true }))
      .on('data', function (f) {
        expect(path.basename(f.path)).not.to.equal('cat.png');
        expect(path.basename(f.path)).not.to.equal('zombie.png');
      })
      .on('end', function () {
        cb();
      });
  });

  it('should resolve paths', function (cb) {
    var filter = require('gulp-filter')('**/*.css');
    gulp
      .src([input('styles/style.css'), input('images/*.*'),
        input('fonts/*.*')], { base: input() })
      .pipe(revsolve())
      .pipe(filter)
      .pipe(require('gulp-rename')({ basename: 'style' }))
      .pipe(gulp.dest(output()))
      .on('end', function () {
        assert.notIsEmptyFile(output('styles/style.css'));
        expect(output('styles/style.css')).to.have.content(content(fixture('styles/style-no-rev.css')));
        cb();
      });
  });

  it('should resolve revisioned paths', function (cb) {
    var filter = require('gulp-filter')('**/*.css');
    es.merge(
      gulp
        .src([input('styles/style.css'), input('images/*.*')],
        { base: input() })
        .pipe(require('gulp-rev')()),
      gulp
        .src([input('fonts/*.*')], { base: input() })
    )
      .pipe(revsolve({ cwd: './test/input', base: './test/input' }))
      .pipe(filter)
      .pipe(require('gulp-rename')({ basename: 'style' }))
      .pipe(gulp.dest(output()))
      .on('end', function () {
        assert.notIsEmptyFile(output('styles/style.css'));
        expect(output('styles/style.css')).to.have.content(content(fixture('styles/style-all-rev.css')));
        cb();
      });
  });

  it('should resolve only revisioned paths', function (cb) {
    var filter = require('gulp-filter')('**/*.css');
    es.merge(
      gulp
        .src([input('styles/style.css'), input('images/*.*')],
        { base: input() })
        .pipe(require('gulp-rev')()),
      gulp
        .src([input('fonts/*.*')], { base: input() })
    )
      .pipe(revsolve({ cwd: './test/input', base: './test/input', resolveNonRev: false }))
      .pipe(filter)
      .pipe(require('gulp-rename')({ basename: 'style' }))
      .pipe(gulp.dest(output()))
      .on('end', function () {
        assert.notIsEmptyFile(output('styles/style.css'));
        expect(output('styles/style.css')).to.have.content(content(fixture('styles/style-only-rev.css')));
        cb();
      });
  });

  it('should resolve and strip src prefix', function (cb) {
    var filter = require('gulp-filter')('**/*.css');
    gulp
      .src([input('styles/style.css'), input('images/*.*'),
        input('fonts/*.*')], { base: input() })
      .pipe(revsolve({ cwd: './test/input', base: './test/input', stripSrcPrefix: '/strip/' }))
      .pipe(filter)
      .pipe(require('gulp-rename')({ basename: 'style' }))
      .pipe(gulp.dest(output()))
      .on('end', function () {
        assert.notIsEmptyFile(output('styles/style.css'));
        expect(output('styles/style.css')).to.have.content(content(fixture('styles/style-strip-src.css')));
        cb();
      });
  });

  it('should resolve and strip dest prefix', function (cb) {
    var filter = require('gulp-filter')('**/*.css');
    gulp
      .src([input('styles/style.css'), input('images/*.*'),
        input('fonts/*.*')], { base: input() })
      .pipe(revsolve({ cwd: './test/input', base: './test/input', stripDestPrefix: '/images/' }))
      .pipe(filter)
      .pipe(require('gulp-rename')({ basename: 'style' }))
      .pipe(gulp.dest(output()))
      .on('end', function () {
        assert.notIsEmptyFile(output('styles/style.css'));
        expect(output('styles/style.css')).to.have.content(content(fixture('styles/style-strip-dest.css')));
        cb();
      });
  });

  it('should resolve files matching specified pattern', function (cb) {
    var filter = require('gulp-filter')('**/*.css');
    gulp
      .src([input('styles/style.css'), input('images/*.*'),
        input('fonts/*.*')], { base: input() })
      .pipe(revsolve({ cwd: '.', base: '.', patterns: '**' }))
      .pipe(filter)
      .pipe(require('gulp-rename')({ basename: 'style' }))
      .pipe(gulp.dest(output()))
      .on('end', function () {
        assert.notIsEmptyFile(output('styles/style.css'));
        expect(output('styles/style.css')).to.have.content(content(fixture('styles/style-dirs.css')));
        cb();
      });
  });

  it('should resolve files with non-matching base', function (cb) {
    var filter = require('gulp-filter')('**/*.css');
    gulp
      .src([input('styles/style.css'), input('images/*.*'),
        input('fonts/*.*')], { base: input() })
      .pipe(revsolve({ cwd: './test/input', base: './another-folder' }))
      .pipe(filter)
      .pipe(require('gulp-rename')({ basename: 'style' }))
      .pipe(gulp.dest(output()))
      .on('end', function () {
        assert.notIsEmptyFile(output('styles/style.css'));
        expect(output('styles/style.css')).to.have.content(content(fixture('styles/style-no-rev.css')));
        cb();
      });
  });

  it('should process only css files', function (cb) {
    var filter = require('gulp-filter')('**/*.css');
    es.merge(
      gulp
        .src(input('styles/style.css'), { base: input() })
        .pipe(require('gulp-rev')()),
      gulp
        .src([input('images/*.*')], { base: input() })
        .pipe(require('gulp-rev')()),
      gulp
        .src([input('fonts/*.*')], { read: false, base: input() })
    )
      .pipe(revsolve({ cwd: './test/input', base: input(), filterExtensions: 'css' }))
      .pipe(filter)
      .pipe(require('gulp-rename')({ basename: 'style' }))
      .pipe(gulp.dest(output()))
      .on('end', function () {
        assert.notIsEmptyFile(output('styles/style.css'));
        expect(output('styles/style.css')).to.have.content(content(fixture('styles/style-all-rev.css')));
        cb();
      });
  });

  it('should ignore css files', function (cb) {
    var filter = require('gulp-filter')('**/*.css');
    es.merge(
      gulp
        .src(input('styles/style.css'), { base: input() })
        .pipe(require('gulp-rev')()),
      gulp
        .src([input('images/*.*')], { base: input() })
        .pipe(require('gulp-rev')()),
      gulp
        .src([input('fonts/*.*')], { read: false, base: input() })
    )
      .pipe(revsolve({ cwd: './test/input', base: input(), skipExtensions: 'css' }))
      .pipe(filter)
      .pipe(require('gulp-rename')({ basename: 'style' }))
      .pipe(gulp.dest(output()))
      .on('end', function () {
        assert.notIsEmptyFile(output('styles/style.css'));
        expect(output('styles/style.css')).to.have.content(content(input('styles/style.css')));
        cb();
      });
  });
});
