'use strict';

var fis = module.exports = require('fis3');
fis.require.prefixes.unshift('axletree');
fis.cli.name = 'axletree';//也即使用axletree封装fis3
fis.cli.info = require('./package.json');

fis.set('modules.commands', ['init', 'release']);

fis.set('template', '/views');
fis.set('static', '/static');
fis.set('config', '/config');
fis.set('tmp', '/tmp');

fis.set('project.ignore', [
    'favicon.ico',
    'README.md',
    'build.sh',
    'component.json',
    'output/**',
    '/client/node_modules/**',
    'fis-conf.js',
    '/static/sass/_*.scss'
]);

var clientRoadmap = {
    '/(**.html)': {
        release: '/${template}/$1'
    },
    '/(apiConf.js)': {
        useHash:false,
        release: '/$1'
    },
    '/sass/(**.{scss,sass})': {
        parser: fis.plugin('node-sass'),
        isCssLike: true,
        useSprite: true,
        release: '/css/$1',
        rExt: '.css'
    },
    '/img/(**)': {
        release: '/img/$1'
    },
    '/js/mod/(*.js)': {
        moduleId: '$1',
        isMod: true,
        packTo: '/js/common.js'
    },
    '/widget/**': {
        useSameNameRequire: true
    },
    '/widget/(**.tpl)': {
        release: '/template/$1',
        isHtmlLike: true
    },
    '/widget/**/(*.{png,jpg,jpeg,gif})': {
        release: '/img/$1'
    },
    '/widget/**/(*).js': {
        moduleId: '$1',
        packTo: '/js/widget.js',
        useMap: true
    },
    '/widget/**/(*.{scss,sass})': {
        parser: fis.plugin('node-sass'),
        isCssLike: true,
        packTo: '/css/widget.css',
        useMap: true,
        rExt: '.css'
    },
    '::package': {    // npm install [-g] fis3-postpackager-loader (doc: https://github.com/fex-team/fis3-postpackager-loader)
        postpackager: fis.plugin('loader', {
            obtainScript: false,
            obtainStyle: false,
            resourceType: 'commonJs',
            sourceMap: true,
            useInlineMap: true,
            allInOne: true
        })
    }
};

// 模块化
fis.hook('commonjs')    // npm install [-g] fis3-hook-commonjs (doc: https://github.com/fex-team/fis3-hook-commonjs)
.match('/{widget,js/mod}/**.{js,es,ts,tsx,jsx}', {
    isMod: true
});

[clientRoadmap].forEach(function(roadmap) {
    fis.util.map(roadmap, function(selector, rules) {
        fis.match(selector, rules);
    });
});

var receiver = 'http://127.0.0.1:8085/axletree/upload';

fis.media('debug').match('!apiConf.js', {
    optimizer: null,
    useHash: false,
    deploy: fis.plugin('http-push', {
        receiver: receiver,
        to: '/static/'
    })
}).match('widget/**.tpl', {
    deploy: fis.plugin('http-push', {
        receiver: receiver,
        to: '/views/'
    })
}).match('/(**.html)', {
    deploy: fis.plugin('http-push', {
        receiver: receiver,
        to: '/'
    })
}).match('/apiConf.js', {
    deploy: fis.plugin('http-push', {
        receiver: receiver,
        to: '/config'
    })
});

// 生产环境
fis.media('prod')
//BASE
.match('*.{png,js,scss,css}', {
  useHash: true
})
.match('*.js', {
    optimizer: fis.plugin('uglify-js')
})
.match('*.{css,scss,sass}', {
    optimizer: fis.plugin('clean-css')
})
.match('*.png', {
    optimizer: fis.plugin('png-compressor')
})
.match('/apiConf.js', {
    optimizer: null,
    useHash:false
});

