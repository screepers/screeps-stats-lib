"use strict";

let gulp = require("gulp");
let tsc = require('gulp-typescript');
let tslint = require('gulp-tslint');

var tsProject = tsc.createProject("tsconfig.json");
gulp.task("build", ["lint"], function() {
    return gulp.src([
        "src/**/**.ts",
        "typings/index.d.ts"
    ])
    .pipe(tsc(tsProject))
    .js.pipe(gulp.dest('dist'));
});

gulp.task('lint', () => {
    return gulp.src([
        'src/**/**.ts'
    ])
    .pipe(tslint({
        formatter: 'verbose'
    }))
    .pipe(tslint.report({
        summarizeFailureOutput: true
    }));
});

gulp.task('default', ['build']);
