const gulp = require('gulp')
const shell = require('gulp-shell')
const clean = require('gulp-clean')
const ts = require('gulp-typescript')
const tsconfig = require('./tsconfig')
const tsProject = ts.createProject("tsconfig.json")

gulp.task('clean', (done) => {
  gulp.src(['dist/**/*', 'example/dist/**/*'], {read: false})
      .pipe(clean())
  done()
})

gulp.task('ts:compile', (done) => {
  const project = gulp.src(tsconfig.include)
                      .pipe(tsProject())
  project.js.pipe(gulp.dest('dist'))
  project.dts.pipe(gulp.dest('types'))
  done()
})

gulp.task('ts:lint', shell.task('npm run lint'))

gulp.task('ts:watch', (done) => {
  gulp.watch(tsconfig.include, gulp.series('ts:lint', 'ts:compile'))
  done()
})

gulp.task('default', gulp.series('ts:lint', 'clean', 'ts:compile', 'ts:watch'))
