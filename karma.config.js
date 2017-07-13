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
      'tests/fogletTest.js',
      'tests/fbroadcastTest.js',
      // 'tests/finterpreterTest.js',
      'tests/fstoreTest.js',
      'tests/middleware-test.js'
    ],
    preprocessors:{
      'tests/fogletTest.js': [ 'coverage', 'browserify' ],
      'tests/fbroadcastTest.js': [ 'coverage', 'browserify' ],
      // 'tests/finterpreterTest.js' : [ 'coverage', 'browserify' ],
      'tests/fstoreTest.js': [ 'coverage', 'browserify' ],
      'tests/middleware-test.js': [ 'coverage', 'browserify' ]
    },
    // list of files to exclude
    exclude: [
      'src/rps/**/*.js',
      'src/utils/**/*.js'
    ],
    // browserify with babelify
    browserify: {
      debug: true,
      transform: [ [ 'babelify', {presets: [ 'es2015' ]} ], 'browserify-istanbul' ]
    },
    extensions: [ '.js' ],
    proxies : {
      './': 'http://localhost:3000'
    },
    port:3001,
    expressHttpServer: {
      port:4001,
      // this function takes express app object and allows you to modify it
      // to your liking. For more see http://expressjs.com/4x/api.html
      appVisitor: signaling
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
    browserNoActivityTimeout:50000,
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
