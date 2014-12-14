var _, path, through, gutil, chalk, istextorbinary;

module.exports = function (options) {
  var assets = [];

  // Lazy load dependencies
  if (!_) {
    _ = require('lodash');
  }
  if (!path) {
    path = require('path');
  }
  if (!through) {
    through = require('through2');
  }

  // Set default options
  options = options || {};
  options = _.assign({
    regex: /(?:url\(["']?(.*?)['"]?\)|src=["'](.*?)['"]|src=([^\s\>]+)(?:\>|\s)|href=["'](.*?)['"]|href=([^\s\>]+)(?:\>|\s))/g,
    debug: 0,
    patterns: [],
    filterExtensions: [],
    skipExtensions: [],
    addSrcPrefix: '',
    addDestPrefix: '/',
    skipUnmentioned: false,
    resolveNonRev: true
  }, options);

  // Set current working directory
  if (!options.cwd) {
    options.cwd = path.resolve('.');
  } else {
    options.cwd = path.resolve(options.cwd);
  }

  // Ensure arrays
  if (_.isString(options.patterns)) {
    options.patterns = [options.patterns];
  }
  if (_.isString(options.filterExtensions)) {
    options.filterExtensions = [options.filterExtensions];
  }
  if (_.isString(options.skipExtensions)) {
    options.skipExtensions = [options.skipExtensions];
  }

  // Make patterns relative
  for (var i = 0; i < options.patterns.length; i++) {
    options.patterns[i] = path.relative(options.cwd, options.patterns[i]);
  }

  // Resolve base
  if (options.base) {
    options.base = path.resolve(options.base);
  }

  // Remove trailing slash
  if (options.stripSrcPrefix) {
    options.stripSrcPrefix = options.stripSrcPrefix.replace(/^\//, '');
  }
  if (options.stripDestPrefix) {
    options.stripDestPrefix = options.stripDestPrefix.replace(/^\//, '');
  }

  function normalize(basePath, fullPath) {
    if (basePath === fullPath.slice(0, basePath.length)) {
      return path.relative(basePath, fullPath);
    } else {
      return path.relative(options.cwd, fullPath);
    }
  }

  //noinspection JSUnusedLocalSymbols
  function transform(file, enc, cb) {
    var filePath;

    if (file.isStream()) {
      if (!gutil) {
        gutil = require('gulp-util');
      }
      cb(new gutil.PluginError('gulp-revsolve', 'Streaming is not supported'));
      return;
    }

    assets.push(file);

    // Pass through empty files
    if (file.isNull()) {
      file.isTextFile = false;
      cb(null, file);
      return;
    }

    // Get original file path
    if (file.revOrigPath) {
      filePath = file.revOrigPath;
    } else {
      filePath = file.path;
    }

    // Detect text files
    if (!istextorbinary) {
      istextorbinary = require('istextorbinary');
    }
    istextorbinary.isText(filePath, file.contents, function(err, result) {
      /* istanbul ignore if  */
      if (err) {
        if (!gutil) {
          gutil = require('gulp-util');
        }
        cb(new gutil.PluginError('gulp-revsolve', 'Wrong content type of file `' + file.path + '`. ' + err));
        return;
      }

      file.isTextFile = result;

      // Filter text extensions
      if (options.filterExtensions.length > 0) {
        if (!_.contains(options.filterExtensions, path.extname(file.path).substr(1))) {
          file.isTextFile = false;
        }
      }

      // Skip text extensions
      if (options.skipExtensions.length > 0) {
        if (_.contains(options.skipExtensions, path.extname(file.path).substr(1))) {
          file.isTextFile = false;
        }
      }

      cb();
    });
  }

  function flush(cb) {
    var self = this;

    // Filter text files
    var sources = assets.filter(function (file) {
      return file.isTextFile;
    });

    _.forEach(sources, function (file) {
      var content = String(file.contents);

      content = content.replace(options.regex, function (str) {
        var items, found, url, match, suffix,
          oldPath, newPath, absolutePath, relativePath, replaced, matched;

        items = _.values(arguments);
        items.shift();
        items = _.compact(items);
        found = _.first(items);

        // No regex match found (additional safe guard)
        /* istanbul ignore if  */
        if (!_.isString(found)) {
          return str;
        }

        url = found.replace(/^\//, '');
        suffix = '';

        // Remove suffix
        match = url.split(/[#\?]/);
        if (match) {
          suffix = url.replace(match[0], '');
          url = match[0];
        }

        // Strip prefix
        if (options.stripSrcPrefix && options.stripSrcPrefix === url.slice(0, options.stripSrcPrefix.length)) {
          url = url.substring(options.stripSrcPrefix.length, url.length);
        }

        // Add prefix
        url = path.join(options.addSrcPrefix, url);

        // Replace in assets
        _.forEach(assets, function (asset) {

          // Skip file itself
          if (asset === file) {
            return;
          }

          // Handle non rev files
          if (options.resolveNonRev && !asset.revOrigPath) {
            asset.revOrigPath = asset.path;
            asset.revOrigBase = asset.base;
          } else if (!asset.revOrigPath) {
            return;
          }

          oldPath = normalize(options.cwd, asset.revOrigPath);
          newPath = normalize(options.base || path.resolve(asset.base), asset.path);

          // Filenames must match
          if (path.basename(oldPath) !== path.basename(url)) {
            return;
          }

          absolutePath = oldPath;
          relativePath = path.relative(path.dirname(file.revOrigPath || file.path), asset.revOrigPath);

          // Match path with url
          matched = absolutePath === url || relativePath === url;
          if (!matched) {
            var minimatch = require('minimatch');
            for (var i = 0; i < options.patterns.length; i++) {
              if (minimatch(absolutePath, path.join(options.patterns[i], url), {matchBase: true})) {
                matched = true;
                break;
              }
            }
          }

          /* istanbul ignore else  */
          if (matched) {
            if (options.skipUnmentioned) {
              self.push(asset);
            }

            // Strip prefix
            if (options.stripDestPrefix && options.stripDestPrefix === newPath.slice(0, options.stripDestPrefix.length)) {
              newPath = newPath.substring(options.stripDestPrefix.length, newPath.length);
            }

            replaced = path.join(options.addDestPrefix, newPath) + suffix;

            str = str.replace(found, replaced);

            /* istanbul ignore if  */
            if (options.debug === 1 || options.debug === 3) {
              if (!gutil) {
                gutil = require('gulp-util');
              }
              if (!chalk) {
                chalk = require('chalk');
              }
              gutil.log(chalk.magenta(normalize(file.base, file.path)) + ':');
              gutil.log(chalk.green(found) + ' ' + chalk.yellow('->') + ' ' + chalk.green(replaced));
            }
          } else if (options.debug === 2 || options.debug === 3) {
            if (!gutil) {
              gutil = require('gulp-util');
            }
            if (!chalk) {
              chalk = require('chalk');
            }
            gutil.log(chalk.red(normalize(file.base, file.path)) + ':');
            gutil.log(chalk.red(url) + ' ' + chalk.red('doesn\'t match') + ' ' + chalk.red(absolutePath) + ', ' + chalk.red(relativePath));
          }
        });
        return str;
      });

      file.contents = new Buffer(content);

      if (options.skipUnmentioned) {
        self.push(file);
      }
    });

    if (!options.skipUnmentioned) {
      _.forEach(assets, function (asset) {
        self.push(asset);
      });
    }

    cb();
  }

  return through.obj(transform, flush);
};
