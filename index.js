module.exports = function (options) {
  var
    _ = require('lodash'),
    path = require('path'),
    through = require('through2'),
    gutil = require('gulp-util'),
    chalk = require('chalk'),
    istextorbinary = require('istextorbinary'),
    options = options || {},
    assets = [];

  options = _.assign({
    regex: /(?:url\(["']?(.*?)['"]?\)|src=["'](.*?)['"]|src=([^\s\>]+)(?:\>|\s)|href=["'](.*?)['"]|href=([^\s\>]+)(?:\>|\s)|ASSET\(['"](.+)['"]\))/g,
    debug: 0,
    dirs: [],
    addSrcPrefix: '',
    addDestPrefix: '/',
    skipUnmentioned: false,
    resolveNonRev: true
  }, options);

  if (!options.cwd) {
    options.cwd = path.resolve('.');
  } else {
    options.cwd = path.resolve(options.cwd);
  }

  if (_.isString(options.dirs)) {
    options.dirs = [options.dirs];
  }

  for (var i = 0; i < options.dirs.length; i++) {
    options.dirs[i] = path.relative(options.cwd, options.dirs[i]);
  }

  if (options.base) {
    options.base = path.resolve(options.base);
  }

  if (options.stripSrcPrefix) {
    options.stripSrcPrefix = options.stripSrcPrefix.replace(/^\//, '');
  }

  if (options.stripDestPrefix) {
    options.stripDestPrefix = options.stripDestPrefix.replace(/^\//, '');
  }

  function transform(file, enc, cb) {
    var filePath;

    if (file.isNull()) {
      cb(null, file);
      return;
    }
    if (file.isStream()) {
      cb(new gutil.PluginError('gulp-revsolve', 'Streaming is not supported'));
      return;
    }

    assets.push(file);

    // Get original file path
    if (file.revOrigPath) {
      filePath = file.revOrigPath;
    } else {
      filePath = file.path;
    }

    // Detect text files
    istextorbinary.isText(filePath, file.contents, function(err, result) {
      /* istanbul ignore if  */
      if (err) {
        cb(new gutil.PluginError('gulp-revsolve', 'Wrong content type of file `' + file.path + '`. ' + err));
        return;
      }
      file.isTextFile = result;
      cb();
    });
  }

  function flush() {
    replace(this);
  }

  function normalize(basePath, fullPath) {
    if (basePath === fullPath.slice(0, basePath.length)) {
      return path.relative(basePath, fullPath);
    } else {
      return path.relative(options.cwd, fullPath);
    }
  }

  function replace(context) {
    // Filter text files
    var sources = assets.filter(function (file) {
      return file.isTextFile;
    });

    _.forEach(sources, function (file) {
      var content = String(file.contents);

      content = content.replace(options.regex, function (str) {
        var items, found, url, match, suffix,
          oldPath, newPath, absolutePath, relativePath, replaced, matched, temp;

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
        url = options.addSrcPrefix + url;

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
            for (var i = 0; i < options.dirs.length; i++) {
              if (minimatch(absolutePath, path.join(options.dirs[i], url), {matchBase: true})) {
                matched = true;
                break;
              }
            }
          }

          /* istanbul ignore else  */
          if (matched) {
            if (options.skipUnmentioned) {
              context.push(asset);
            }

            // Strip prefix
            if (options.stripDestPrefix && options.stripDestPrefix === newPath.slice(0, options.stripDestPrefix.length)) {
              newPath = newPath.substring(options.stripDestPrefix.length, newPath.length);
            }

            replaced = options.addDestPrefix + newPath + suffix;

            str = str.replace(found, replaced);

            /* istanbul ignore if  */
            if (options.debug >= 1) {
              gutil.log(chalk.magenta(normalize(file.base, file.path)) + ':');
              gutil.log(chalk.green(found) + ' ' + chalk.yellow('->') + ' ' + chalk.green(replaced));
            }
          } else if (options.debug >= 2) {
            gutil.log(chalk.red(normalize(file.base, file.path)) + ':');
            gutil.log(chalk.red(url) + ' ' + chalk.red('doesn\'t match') + ' ' + chalk.red(absolutePath) + ', ' + chalk.red(relativePath));
          }
        });
        return str;
      });

      file.contents = new Buffer(content);

      if (options.skipUnmentioned) {
        context.push(file);
      }
    });

    if (!options.skipUnmentioned) {
      _.forEach(assets, function (asset) {
        context.push(asset);
      });
    }

    context.emit('end');
  }

  return through.obj(transform, flush);
};
