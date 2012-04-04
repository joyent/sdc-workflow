// Copyright (c) 2012, Joyent, Inc. All rights reserved.

var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    http = require('http'),
    https = require('https'),
    wf = require('wf'),
    config_file = path.resolve(__dirname, 'etc/config.json'),
    config,
    runner,
    log;


fs.readFile(config_file, 'utf8', function (err, data) {
  if (err) {
    console.error('Error reading config file:');
    console.dir(err);
    process.exit(1);
  } else {
    try {
      config = JSON.parse(data);
    } catch (e) {
      console.error('Error parsing config file JSON:');
      console.dir(e);
      process.exit(1);
    }

    if (typeof (config.maxHttpSockets) === 'number') {
      console.log('Tuning max sockets to %d', config.maxHttpSockets);
      http.globalAgent.maxSockets = config.maxHttpSockets;
      https.globalAgent.maxSockets = config.maxHttpSockets;
    }

    config.logger = {
      streams: [ {
        level: 'debug',
        stream: process.stdout
      }]
    };

    runner = wf.Runner(config);
    runner.init(function (err) {
      if (err) {
        console.error('Error initializing runner:');
        console.dir(err);
        process.exit(1);
      }
      runner.run();

      log = runner.log;
      log.info('Workflow Runner up!');

      // Setup a logger on HTTP Agent queueing
      setInterval(function () {
        var agent = http.globalAgent;
        if (agent.requests && agent.requests.length > 0) {
          log.warn('http.globalAgent queueing, depth=%d',
                   agent.requests.length);
          }
        agent = https.globalAgent;
        if (agent.requests && agent.requests.length > 0) {
          log.warn('https.globalAgent queueing, depth=%d',
                   agent.requests.length);
          }
      });
    });
  }
});

