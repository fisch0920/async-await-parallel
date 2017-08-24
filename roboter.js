'use strict';

const roboter = require('roboter');

roboter
  .workOn('server')
  .equipWith(task => {
    task('universal/analyze', {
      src: ['**/*.js', '!node_modules/**/*.js', '!dist/**/*.js', '!examples_from_oracledb/**/*.js'],
      rules: '.eslintrc.json'
    });
    task('universal/shell', {
      'test-live': './node_modules/mocha/bin/_mocha --async-only --bail ' +
      '--colors --recursive --reporter spec --timeout 20000 --ui tdd test/live'
    });
    task('universal/license', {
      disable: true
    });
  })
  .start();
