'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var rename = require("gulp-rename");
var map = require("map-stream");
var livereload = require("gulp-livereload");
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var svgSprite = require('gulp-svg-sprite');
var concat = require('gulp-concat');
var path = require('path');
var glob = require('glob');
var sassGraph = require('sass-graph');
var fs = require('fs');
var gulpSequence = require('gulp-sequence');
var babel = require('gulp-babel');
var imagemin = require('gulp-imagemin');
var del = require('del');
var vinylPaths = require('vinyl-paths');

//======================================================================================//
//Config
//======================================================================================//

global.errorMessage = '';

//Recuperation du fichier d'assets
var assetsFile = './assets.json';
var assets = require(assetsFile);
var date = new Date();
var isDev = assets.site.env == 'development';

//Configuration des différents modules gulp
var config = {
    isDev: isDev,
    versionNum: date.getTime(),
    sass: {
        output: assets.site.prefix + assets.site.assets_dest + '/css/',
        compilerOptions: {
            outputStyle: isDev ? 'nested' : 'compressed'
        }
    },
    js: {
        output: assets.site.prefix + assets.site.assets_dest + '/js/'
    },
    svgSprites: {
        src: assets.site.prefix + assets.site.assets_src + '/svg/sprites/*.svg',
        compilerOptions: {
            shape: {
                dimension: {			// Set maximum dimensions
                    maxWidth: 1280,
                    maxHeight: 1280
                },
                spacing: {			// Add padding
                    padding: 5
                }
            },
            mode: {
                view: {			// Activate the «view» mode
                    bust: false,
                    render: {
                        scss: true		// Activate Sass output (with default options)
                    }
                },
                symbol: true
            },
        },
        dest: assets.site.prefix + assets.site.assets_dest + '/svg/'
    },
    autoPrefixr: {},
    images: {
        src: assets.site.prefix + assets.site.assets_src + '/images/*',
        dest: assets.site.prefix + assets.site.assets_dest + '/images/'
    }
};

//======================================================================================//
//Tasks
//======================================================================================//

gulp.task('write-version', function () {
    //console.log('write-version');
    var versionContent = '<?php return ' + config.versionNum + '; ?>';
    var thisPipe = string_src('version.php', versionContent)
        .pipe(gulp.dest(assets.site.prefix + assets.site.assets_dest));
    console.log('The new version num is now ' + config.versionNum);
    //console.log('end write-version');
    return thisPipe;
});

gulp.task('svg-build', function () {
    //console.log('svg-build');
    var svgSrc = config.svgSprites.src,
        svgDest = config.svgSprites.dest;
    console.log('Getting svgs from ' + svgSrc);
    console.log('And trying to write to ' + svgDest);
    return gulpSrc(svgSrc)
        .pipe(svgSprite(config.svgSprites.compilerOptions))
        .pipe(gulp.dest(svgDest));
});

gulp.task('watch', function () {
    //Watch assets defined in json files
    var sassDatas = getSassDatas();
    for (var i in sassDatas) {
        sassWatch(sassDatas[i]);
    }
    var jsDatas = getJsDatas();
    for (var j in jsDatas) {
        jsWatch(jsDatas[j]);
    }
});
gulp.task('build-others', function () {
    //console.log('build-others');
    //Watch assets defined in json files
    //console.log('build-others-sass');
    var sassDatas = getSassDatas();
    for (var i in sassDatas) {
        sassCompile(sassDatas[i]);
    }
    //console.log('build-others-js');
    var jsDatas = getJsDatas();
    for (var j in jsDatas) {
        jsCompile(jsDatas[j]);
    }
    //console.log('end-build-others');
});

gulp.task('img-build', function () {
        var imgSrc = config.images.src,
            imgDest = config.images.dest;
        console.log('Getting images from ' + imgSrc);
        console.log('And trying to write to ' + imgDest);
        return gulp.src(imgSrc)
            .pipe(vinylPaths(del))
            .pipe(imagemin())
            .pipe(gulp.dest(imgDest));
    }
);


gulp.task('test', function () {
    console.log('test');
});

gulp.task('build', gulpSequence('write-version', 'svg-build', 'img-build', 'build-others'));
gulp.task('default', gulpSequence('build', 'watch'));

//======================================================================================//
// Functions
//======================================================================================//

function getSassDatas() {
    var sassDatas = [];
    for (var i in assets.css) {
        var sassData = {
            name: i,
            files: assets.css[i],
            watchers: [],
            output: config.sass.output,
            destName: i + config.versionNum + '.css'
        };
        for (var j in assets.css[i]) {
            var deps = sassGraph.parseFile(assets.css[i][j]);
            for (var k in deps.index) {
                sassData.watchers.push(k);
            }
        }
        sassDatas.push(sassData);
    }
    return sassDatas;
}

function sassWatch(sassData) {
    return gulpSrc(sassData.files)
        .pipe(watch(sassData.watchers, {}, function (file) {
            if (file && file.basename) {
                console.log(file.basename + ' has been changed. Compiling ' + sassData.name + ' group');
                sassCompile(sassData);
            }
        }));
}

function sassCompile(sassData) {
    //Create fake scss file
    var groupScssContent = '';
    for (var i in sassData.files) {
        groupScssContent += '@import "' + sassData.files[i] + '";' + "\n";
    }

    //Delete previous versions
    var oldVersions = sassData.output + sassData.name + '*.css';
    glob(oldVersions, function (err, files) {
        if (err) throw err;
        // Delete files
        files.forEach(function (item) { /*, index, array*/
            fs.unlink(item, function (err) {
                if (err) throw err;
            });
        });
    });

    //Compile
    return string_src(sassData.name + '.scss', groupScssContent)
    //.pipe(gulp.dest(config.sass.output))
        .pipe(sourcemaps.init())
        .pipe(sass(config.sass.compilerOptions))
        .pipe(autoprefixer(config.autoPrefixr))
        .pipe(sourcemaps.write())
        .on('error', function (err) {
            gutil.log(err.message);
            gutil.beep();
            global.errorMessage = err.message + " ";
        })
        .pipe(checkErrors())
        .pipe(rename(sassData.destName))
        .pipe(gulp.dest(sassData.output))
        .pipe(livereload());
}


function getJsDatas() {
    var jsDatas = [];
    for (var i in assets.js) {
        var jsData = {
            name: i,
            files: assets.js[i],
            watchers: assets.js[i],
            output: config.js.output,
            destName: i + config.versionNum + '.js'
        };
        jsDatas.push(jsData);
    }
    return jsDatas;
}

function jsWatch(jsData) {

    return gulpSrc(jsData.files)
        .pipe(watch(jsData.watchers, {}, function (file) {
            if (file && file.basename) {
                console.log(file.basename + ' has been changed. Compiling ' + jsData.name + ' group');
                jsCompile(jsData);
            }
        }));
}

function jsCompile(jsData) {
    //Delete previous versions
    var oldVersions = jsData.output + jsData.name + '*.js';
    glob(oldVersions, function (err, files) {
        if (err) throw err;
        // Delete files
        files.forEach(function (item) { /*, index, array*/
            fs.unlink(item, function (err) {
                if (err) throw err;
            });
        });
    });

    if (!isDev) {
        return gulpSrc(jsData.files)
            .pipe(sourcemaps.init())
            .pipe(babel({presets: ['es2015']}))
            .pipe(concat(jsData.destName))
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(jsData.output));
    } else {
        return gulpSrc(jsData.files)
            .pipe(concat(jsData.destName))
            .pipe(gulp.dest(jsData.output));
    }
}


function string_src(filename, string) {
    var src = require('stream').Readable({objectMode: true});
    src._read = function () {
        this.push(new gutil.File({cwd: "", base: "", path: filename, contents: new Buffer(string)}));
        this.push(null);
    };
    return src;
}

function gulpSrc(paths) {
    paths = (paths instanceof Array) ? paths : [paths];
    var existingPaths = paths.filter(function (path) {
        if (glob.sync(path).length === 0) {
            console.log(path + ' doesnt exist');
            return false;
        }
        return true;
    });
    return gulp.src((paths.length === existingPaths.length) ? paths : []);
}

// Does pretty printing of sass errors
var checkErrors = function (obj) {
    function checkErrors(file, callback) { /*, errorMessage*/
        if (file.path.indexOf('.scss') != -1) {
            file.contents = new Buffer("\
					body * { white-space:pre; }\
					body * { display: none!important; }\
					body:before {\
						white-space:pre;\
						content: '" + global.errorMessage.replace(/(\\)/gm, "/").replace(/(\r\n|\n|\r)/gm, "\\A") + "';\
					}\
					html{background:#ccf!important; }\
				");
        }
        callback(null, file);
    }

    return map(checkErrors);
};