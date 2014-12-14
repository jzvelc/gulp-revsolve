[![NPM version](https://badge.fury.io/js/gulp-revsolve.svg)](http://badge.fury.io/js/gulp-revsolve)
[![Build Status](https://travis-ci.org/jzvelc/gulp-revsolve.svg?branch=master)](https://travis-ci.org/jzvelc/gulp-revsolve)
[![Code Climate](https://codeclimate.com/github/jzvelc/gulp-revsolve/badges/gpa.svg)](https://codeclimate.com/github/jzvelc/gulp-revsolve)
[![Test Coverage](https://codeclimate.com/github/jzvelc/gulp-revsolve/badges/coverage.svg)](https://codeclimate.com/github/jzvelc/gulp-revsolve)

# [gulp](http://gulpjs.com)-revsolve

Resolves asset references to absolute paths. Revisioned assets processed
by [gulp-rev](https://github.com/sindresorhus/gulp-rev) can be replaced as well.

This plugin is based on awesome [gulp-revplace](https://github.com/tenphi/gulp-revplace) by [Andrey Yamanov](https://github.com/tenphi).
It removes dependency on [mmmagic](https://github.com/mscdex/mmmagic) which caused problems with installation.
In contrast to [gulp-revplace](https://github.com/tenphi/gulp-revplace) this plugin provides more grained control over
assets with additional options.

_Note_: Use {read: false} option with gulp.src for files that don't require content processing.

## Installation

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

## Options

### revsolve(options)

#### regex

_Type_: [`RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

_Usage_: Sets a custom regex to match on your files.

_Default_: `/(?:url\(["']?(.*?)['"]?\)|src=["'](.*?)['"]|src=([^\s\>]+)(?:\>|\s)|href=["'](.*?)['"]|href=([^\s\>]+)(?:\>|\s))/g`

#### cwd
_Type_: `String`

_Usage_: Current working directory. This should match project root directory.

_Default_: '.'

#### base
_Type_: `String`

_Usage_: Set this to override asset base paths. This is useful when dealing with sources which have different base paths.

_Default_: `path.resolve(file.base)`

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

_Default_: '/'

#### stripSrcPrefix
_Type_: `String`

_Usage_: Strip prefix from source urls.

_Default_: null

#### stripDestPrefix
_Type_: `String`

_Usage_: Strip prefix from replaced urls.

_Default_: null

#### filterExtensions
_Type_: `Array`

_Usage_: Process only contents of text files with specified extensions.

_Default_: []

#### skipExtensions
_Type_: `Array`

_Usage_: Skip processing contents of text files with specified extensions.

_Default_: []

#### skipUnmentioned
_Type_: `Boolean`

_Usage_: If true only assets that are mentioned in source files will be passed through stream. Source files are always passed.

_Default_: false

#### resolveNonRev
_Type_: `Boolean`

_Usage_: If false only revised assets will be replaced.

_Default_: true

#### debug
_Type_: `Integer`

_Usage_: Activate debug mode by specifying verbosity.

_Values_: 0, 1, 2, 3

_Default_: 0

- 0: disabled
- 1: log resolved paths
- 2: log unresolved paths
- 3: log all

## License

The MIT License (MIT)

Copyright (c) 2014 Jure Žvelc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.