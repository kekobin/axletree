#!/usr/bin/env node

var Liftoff = require('liftoff');
var argv = require('minimist')(process.argv.slice(2));
var path = require('path');
var fs = require('fs');
var cli = new Liftoff({
    name: 'axletree', // 命令名字
    processTitle: 'axletree',
    moduleName: 'axletree/index.js',
    configName: 'fis-conf',

    // only js supported!
    extensions: {
        '.js': null
    }
});


cli.launch({
    cwd: argv.r || argv.root,
    configPath: argv.f || argv.file
}, function (env) {
    var fis;

    try {
        var conf = fs.readFileSync(env.configPath).toString();
        if (conf.match(/\/\*\s?fis3-enable\s?\*\//img) || conf.match(/\/\/\s?fis3-enable/img)) {
            argv.fis3 = true;
        }
    }
    catch (e) {}

    delete argv.F;
    delete argv.fis3;


    if (!env.modulePath) {
        fis = require('../index.js');
    }
    else {
        fis = require(env.modulePath);
    }
    fis.IS_FIS3 = true;
    fis.require.paths.unshift(path.join(env.cwd, 'node_modules'));
    fis.require.paths.push(path.join(path.dirname(__dirname), 'node_modules'));
    fis.require.paths.push(path.join(path.join(path.dirname(__dirname), 'node_modules', 'fis3', 'node_modules')));
    fis.cli.run(argv, env);
});
