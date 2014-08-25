/**************/
/*  REQUIRES  */
/**************/
var gulp = require("gulp");

// File IO
var sass = require("gulp-sass");
var concat = require("gulp-concat");
var jshint = require("gulp-jshint");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var streamqueue = require("streamqueue");

// Testing
var karma = require("gulp-karma");


/****************/
/*  FILE PATHS  */
/****************/
// var paths = {
//   destDir: "dist",

//   scripts: {
//     src: {
//       dir: "src/",
//       files: [
//         "**/*.js"
//       ]
//     },
//     dest: {
//       dir: "dist/js/",
//       files: {
//         unminified: "firegrapher.js",
//         minified: "firegrapher.min.js"
//       }
//     }
//   },

//   tests: {
//     config: "tests/karma.conf.js",
//     files: [
//       "bower_components/firebase/firebase.js",
//       "src/*.js",
//       "tests/specs/*.spec.js"
//     ]
//   }
// };


/***********/
/*  TASKS  */
/***********/
/* Lints, minifies, and concatenates the script files */
gulp.task("scripts", function() {
  return;

  // // Concatenate all src files together
  // var stream = streamqueue({ objectMode: true });
  // stream.queue(gulp.src("build/header"));
  // stream.queue(gulp.src(paths.scripts.src.dir + paths.scripts.src.files));
  // stream.queue(gulp.src("build/footer"));

  // // Output the final concatenated script file
  // return stream.done()
  //   // Rename file
  //   .pipe(concat(paths.scripts.dest.files.unminified))

  //   // Lint
  //   .pipe(jshint())
  //   .pipe(jshint.reporter("jshint-stylish"))

  //   // Write un-minified version
  //   .pipe(gulp.dest(paths.scripts.dest.dir))

  //   // Minify
  //   .pipe(uglify())

  //   // Rename file
  //   .pipe(concat(paths.scripts.dest.files.minified))

  //   // Write minified version to the distribution directory
  //   .pipe(gulp.dest(paths.scripts.dest.dir));
});

/* Compile SCSS files into CSS files */
gulp.task("styles", function () {
  return gulp.src("sass/*.scss")
    .pipe(sass({
      "outputStyle" : "compressed",
      "errLogToConsole": true
    }))
    .pipe(rename(function(path) {
        path.extname = ".css"
    }))
    .pipe(gulp.dest("css"));
});

/* Uses the Karma test runner to run the Jasmine tests */
gulp.task("test", function() {
  return;
  // return gulp.src(paths.tests.files)
  //   .pipe(karma({
  //     configFile: paths.tests.config,
  //     action: "run"
  //   }))
  //   .on("error", function(err) {
  //     throw err;
  //   });
});

/* Runs tasks when certain files change */
gulp.task("watch", function() {
  //gulp.watch(["js/*", paths.scripts.src.dir + paths.scripts.src.files], ["scripts"]);
  gulp.watch(["sass/*.scss"], ["styles"]);
});


/* Builds and tests the files by default */
gulp.task("default", ["scripts", "styles", "test"]);