"use strict";

let gulp = require("gulp");
let merge = require("merge2");
let ts = require('gulp-typescript');
let tslint = require('gulp-tslint');

var tsProject = ts.createProject("tsconfig.json");

gulp.task("build", ["lint"], function() {
    var tsResult = tsProject.src()
            .pipe(ts(tsProject));

    return merge([
        tsResult.dts.pipe(gulp.dest("dist")),
        tsResult.js.pipe(gulp.dest("dist"))
    ]);
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
