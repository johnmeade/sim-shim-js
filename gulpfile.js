var gulp = require("gulp");
var babel = require("gulp-babel");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

var DEST = "dist";

gulp.task("default", function () {
  return gulp.src([
      'vendor/**/*.js',
      'src/sim-shim.es6'
    ])
    .pipe(babel({ 'only': /.es6/ }))
    .pipe(concat('sim-shim-bundle.js'))
    .pipe(gulp.dest(DEST))
    .pipe(sourcemaps.init())
      .pipe(uglify())
      .pipe(rename({ extname: '.min.js' }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(DEST));
});
