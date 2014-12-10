[![NPM version](https://badge.fury.io/js/gulp-revsolve.svg)](http://badge.fury.io/js/gulp-revsolve)
[![Build Status](https://travis-ci.org/jzvelc/gulp-revsolve.svg?branch=master)](https://travis-ci.org/jzvelc/gulp-revsolve)
[![Coverage Status](https://coveralls.io/repos/jzvelc/gulp-revsolve/badge.png)](https://coveralls.io/r/jzvelc/gulp-revsolve)

# [gulp](http://gulpjs.com)-revsolve

Resolves asset references to absolute paths. Revisioned assets processed
by [gulp-rev](https://github.com/sindresorhus/gulp-rev) can be replaced as well.

This plugin is based on awesome [gulp-revplace](https://github.com/tenphi/gulp-revplace) by [Andrey Yamanov](https://github.com/tenphi).
It removes dependency on [mmmagic](https://github.com/mscdex/mmmagic) which caused problems with installation.
In contrast to [gulp-revplace](https://github.com/tenphi/gulp-revplace) this plugin provides more grained control over
assets with additional options.

## Install

```
npm install --save-dev gulp-revsolve
```

## Usage

```javascript
var gulp = require('gulp');
var base = 'somedir';

gulp.task('default', function () {
  var
    revsolve = require('gulp-revsolve'),
    es = require('event-stream');

  return es.merge(
    gulp
      .src([base + '/index.html'], { base: base }),
    gulp
      .src([base + '/*/**/*.*'], { base: base })
      .pipe(rev())
  )
    .pipe(revsolve())
    .pipe(gulp.dest('somedir'));
});
```

Check [gulp-revplace](https://github.com/tenphi/gulp-revplace) documentation
for additional info.

## API

### revplace(options)

#### regex

_Type_: [`RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

_Usage_: Sets a custom regex to match on your files.

_Default_: `/(?:url\(["']?(.*?)['"]?\)|src=["'](.*?)['"]|src=([^\s\>]+)(?:\>|\s)|href=["'](.*?)['"]|href=([^\s\>]+)(?:\>|\s))/g`

#### cwd
_Type_: `String`

_Usage_: Current working directory. This should match project root directory.

_Default_: .

#### base
_Type_: `String`

_Usage_: Set this to override asset base paths. This is useful when dealing with sources which have different base paths.

#### patterns
_Type_: `Array`

_Usage_: Glob patterns which will be used to perform additional matching. Patterns are prepended to source paths.

_Default_: []

#### addSrcPrefix
_Type_: `String`

_Usage_: Add prefix to source urls.

_Default_: ''

#### addDestPrefix
_Type_: `String`

_Usage_: Add prefix to replaced urls.

_Default_: /

#### stripSrcPrefix
_Type_: `String`

_Usage_: Strip prefix from source urls.

#### stripDestPrefix
_Type_: `String`

_Usage_: Strip prefix from replaced urls.

#### skipUnmentioned
_Type_: `Boolean`

_Usage_: If true only assets that are mentioned in source files will be passed through stream. Source files are always passed.

_Default_: false

#### resolveNonRev
_Type_: `Boolean`

_Usage_: If false only revisioned assets will be replaced.

_Default_: true

#### debug
_Type_: `Integer`

_Usage_: Activate debug by specifying verbosity.

_Values_: 0 1 2

_Default_: 0

## License

[MIT](https://github.com/jzvelc/gulp-revsolve/blob/master/LICENSE) © [Jure Žvelc](https://github.com/jzvelc)