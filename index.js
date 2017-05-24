'use strict';

var fis = module.exports = require('fis3');
fis.require.prefixes.unshift('axletree');
fis.cli.name = 'axletree';//也即使用axletree封装fis3
fis.cli.info = require('./package.json');

fis.set('modules.commands', ['init', 'install', 'release']);

fis.set('template', '/views');
fis.set('static', '/static');
fis.set('config', '/config');
fis.set('project.fileType.text', 'es,ts,tsx,jsx');
fis.set('project.ignore', [
    'favicon.ico',
    'README.md',
    'build.sh',
    'component.json',
    'output/**',
    '/client/node_modules/**',
    'fis-conf.js'
]);

var clientRoadmap = {
    // all release to $static dir
    '/(**)': {
        id: '$1',
        moduleId: '${namespace}:$1',
        release: '/${static}/$1'
    },
    '/**.sass': {
        parser: fis.plugin('sass'),
        rExt: '.css'
    },
    '/{**.ts,**.tsx,**.jsx,**.es}': {
        parser: fis.plugin('typescript', {
            module: 1,
            target: 0,
            sourceMap: true
        }),
        rExt: 'js'
    },
    '/**.tpl': {
        preprocessor: fis.plugin('extlang'),
        postprocessor: fis.plugin('require-async'),
        useMap: true
    },
    '/**.{tpl,js,ts,jsx,es,tsx}': {
        useSameNameRequire: true
    },
    '/page/**.html': {
        extras: {
            isPage: true
        }
    },
    '/(page/**.html)': {
        url: '$1',
        release: '/${template}//$1',
        useMap: true
    },
    '/(widget/**.html)': {
        url: '$1',
        release: '/${template}/$1',
        useMap: true
    },
    '{components,widget}/**.{js,es,ts,tsx,jsx,css,less}': {
        isMod: true
    },
    '${namespace}-map.json': {
        release: '${config}/fis/${namespace}-map.json'
    },
    '::package': {}
};

var commonRoadmap = {
    '**.sh': {
        release: false
    },
    '**': {
        release: '${static}/$0'
    }
};

var prodRoadmap = {
    '/**.{js,css,less,ts,jsx,es,tsx}': {
        useHash: true
    },
    '/**.{js,ts,jsx,es,tsx}': {
        optimizer: fis.plugin('uglify-js')
    },
    '/**.{css,sass}': {
        optimizer: fis.plugin('clean-css')
    },
    '::image': {
        useHash: true
    },
    '/**.png': {
        optimizer: fis.plugin('png-compressor')
    }
};

// 添加自定义命令
// fis.require._cache['command-run'] = require('./command/run.js');

[commonRoadmap, clientRoadmap, prodRoadmap].forEach(function(roadmap) {
    fis.util.map(roadmap, function(selector, rules) {
        fis.match(selector, rules);
    });
});

// 发布模式关闭sourceMap
fis.media('prod').match('/{**.ts,**.tsx,**.jsx,**.es}', {
    parser: fis.plugin('typescript', {
        module: 1,
        target: 0
    }),
    rExt: 'js'
});
// 模块化支持
fis.hook('commonjs', {
    extList: ['.js', '.es', '.ts', '.tsx', '.jsx']
});

// map.json
fis.match('::package', {
    postpackager: function createMap(ret, conf, settings, opt) {
        var maps = {};
        fis.util.map(ret.src, function(subpath, file) {
            maps[file.id] = file;
        });
        var pkgMaps = {};
        fis.util.map(ret.pkg, function(subpath, file) {
            pkgMaps[file.getUrl()] = file;
        });
        var path = require('path');
        var root = fis.project.getProjectPath();
        var map = fis.file.wrap(path.join(root, fis.get('namespace') + '-map.json'));
        var resKeys = Object.keys(ret.map.res);
        var pkgKeys = Object.keys(ret.map.pkg);
        for (var i = 0; i < resKeys.length; i++) {
            var resId = resKeys[i];
            if (maps[resId]) {
                ret.map.res[resId].subpath = maps[resId].getHashRelease();
            } else {
                fis.log.warning(resId + ' is missing');
            }
        }
        for (var j = 0; j < pkgKeys.length; j++) {
            var pkg = ret.map.pkg[pkgKeys[j]];
            if (pkgMaps[pkg.uri]) {
                pkg.subpath = pkgMaps[pkg.uri].getHashRelease();
            } else {
                fis.log.warning(pkg.uri + ' is missing');
            }
        }
        map.setContent(JSON.stringify(ret.map, null, 4));
        ret.pkg[map.subpath] = map;
    }
});
