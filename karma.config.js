// Karma configuration
// Generated on Thu Nov 03 2016 06:11:50 GMT+0100 (Paris, Madrid)
'use strict';

const signaling = require('foglet-signaling-server');

module.exports = function (config) {
  config.set({
    hostname: 'localhost',
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [ 'browserify', 'mocha', 'chai', 'express-http-server' ],
    plugins: [
      'karma-browserify',
      'karma-mocha',
      'karma-chai',
      'karma-coverage',
      'karma-mocha-reporter',
      'karma-firefox-launcher',
      'karma-express-http-server'
    ],
    // list of files / patterns to load in the browser
    files: [
      'tests/*-test.js'
    ],
    preprocessors: {
      'tests/*-test.js': [ 'browserify' ]
    },
    // list of files to exclude
    exclude: [
      // overlays are currently unstable
      'tests/overlay-test.js'
    ],
    // browserify with babelify
    browserify: {
      debug: true,
      transform: [
        [ 'babelify', {presets: [ 'es2015' ]} ],
        'browserify-istanbul'
      ],
    },
    extensions: [ '.js' ],
    port: 3001,
    expressHttpServer: {
      port: 4001,
      // inject foglet signaling server
      appVisitor: signaling
    },
    client: {
      mocha: {
        timeout: 20000
      }
    },
    reporters: [ 'coverage', 'mocha' ],
    coverageReporter: {
      // specify a common output directory
      dir: 'coverage',
      reporters: [
        // reporters not supporting the `file` property
        // { type: 'html', subdir: 'report-html' },
        // { type: 'lcov', subdir: 'report-lcov' },
        // reporters supporting the `file` property, use `subdir` to directly
        // output them in the `dir` directory
        // { type: 'cobertura', subdir: '.', file: 'cobertura.txt' },
        { type: 'lcovonly', subdir: '.' },
        { type: 'text', subdir: '.', file: 'text.txt' },
        { type: 'text-summary', subdir: '.'  }
      ],
      instrumenterOptions: {
        istanbul: { noCompact: true }
      }
    },
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    autoWatch: true,
    browserNoActivityTimeout: 50000,
    colors: true,
    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [ 'Firefox' ],
    singleRun: true,
    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
};
