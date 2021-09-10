#!/usr/bin/env node

const yargs = require('yargs');
const { run } = require('../src');

const { argv } = yargs
  .usage('Use a Novation Launchpad as an OBS Studio controller')
  .option('hostname', {
    description: 'obs-websocket hostname',
    type: 'string',
  })
  .option('port', {
    description: 'obs-websocket port',
    type: 'number',
  })
  .option('password', {
    alias: 'p',
    description: 'obs-websocket password',
    type: 'string',
  })
  .help()
  .alias('help', 'h');

run(argv.hostname, argv.port, argv.password);
