'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var plumber = require('gulp-plumber');
var istanbul = require('gulp-istanbul');
var coveralls = require('gulp-coveralls');

var paths = {
  js: ['start-here.js', 'src/**/*.js', '!src/**/tests/*.js'],
  scss: ['src/**/src/scss/*.scss'],
  css: ['src/**/public/*.css'],
  tests: ['tests/**/*.js', 'src/**/tests/*.js']
};

var onError = function (error) {
    console.log(error);
    this.emit('end');
    throw error;
};

gulp.task('lint-code', function () {
    gulp.src(paths.js)
        .pipe(plumber({errorHandler: onError}))
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});
gulp.task('lint', ['lint-code']);

gulp.task('test', function (cb) {
    gulp.src(paths.js)
        .pipe(plumber({errorHandler: onError}))
        .pipe(istanbul())
        .pipe(istanbul.hookRequire())
        .on('finish', function () {
            gulp.src(paths.tests)
                .pipe(mocha({reporter: 'spec'}))
                .pipe(istanbul.writeReports())
                .on('end', cb);
        });
});

gulp.task('coveralls', ['test'], function() {
  return gulp.src(['coverage/**/lcov.info'])
    .pipe(coveralls());
});

gulp.task('default', ['lint', 'test']);