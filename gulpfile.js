import {src, dest, watch, series, parallel} from "gulp";
import plumber from "gulp-plumber"
import sourcemaps from "gulp-sourcemaps";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import csso from "postcss-csso";
import rename from "gulp-rename";
import htmlmin from "gulp-htmlmin";
import terser from "gulp-terser";
import imagemin, { mozjpeg, optipng } from "gulp-imagemin";
import webp from "gulp-webp";
import { deleteSync } from "del";
import svgstore from "gulp-svgstore";
import sync from "browser-sync";
const sass = gulpSass(dartSass);


// Styles

export const styles = () => {
  return src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(rename("style.min.css"))
    .pipe(sourcemaps.write("."))
    .pipe(dest("build/css"))
    .pipe(sync.stream());
}

// HTML

const html = () => {
  return src("source/*.html")
    .pipe(htmlmin({ collapseWhitespace: false }))
    .pipe(dest("build"));
}

// Scripts

export const scripts = () => {
  return src("source/js/*.js")
    .pipe(terser())
    .pipe(rename("script.min.js"))
    .pipe(dest("build/js"))
    .pipe(sync.stream());
}

// Images

export const optimizeImages = () => {
  return src("source/img/**/*.{png,jpg,svg}", { encoding: false })
    .pipe(imagemin([
      mozjpeg({ quality: 75, progressive: true }),
      optipng({ optimizationLevel: 5 })
    ]))
    .pipe(dest("build/img"))
}

export const copyImages = () => {
  return src("source/img/**/*.{png,jpg,svg}", { encoding: false })
    .pipe(dest("build/img"))
}

// WebP

export const createWebp = () => {
  return src("source/img/**/*.{png,jpg}")
    .pipe(webp({quality: 90}))
    .pipe(dest("build/img"))
}

// Sprite

const sprite = () => {
  return src("source/img/icons/*.svg")
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(dest("build/img"))
}

// Copy
export const copy = (done) => {
  src([
    "source/fonts/*.{woff2,woff}",
    "source/*.ico",
    "source/img/*.ico",
    "source/img/**/*.svg",
    "!source/img/icons/*.svg",
  ], {
    base: "source",
    encoding: false
  })
    .pipe(dest("build"))
  done();
}

// Clean

const clean = (done) => {
  deleteSync("build");

  done();
}

// Server

export const server = (done) => {
  sync.init({
    server: {
      baseDir: "build"
    },
    cors: true,
    notify: false,
    ui: false,
    open: false
  });

  done();
}

// Reload

const reload = (done) => {
  sync.reload();
  done();
}

// Watcher

const watchFiles = () => {
  watch(["source/sass/**/*.scss"], series(styles));
  watch("source/**/*.js", series(scripts, reload));
  watch("source/*.html", series(html, reload));
}

// Build

export const build = series(
  clean,
  copy,
  optimizeImages,
  parallel(
    styles,
    html,
    scripts,
    sprite,
    createWebp
  )
);

// Default
export default series(
    clean,
    copy,
    copyImages,
    parallel(
      styles,
      html,
      scripts,
      sprite,
      createWebp
    ),
    server,
    watchFiles
  );

