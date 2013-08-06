#!/usr/bin/env node

var argv = require('optimist').argv,
    Shade = require('..'),
    usage = "node ./js2glsl.js script.js [-p]";

(function (args) {

    var fs = require("fs"),
        path = require("path"),
        GLSLCompiler = require("../src/generate/glsl/compiler").GLSLCompiler,
        filename = args._[0];


    if (!filename) {
        console.log(usage);
        process.exit(0);
    }

    var ctx = filename.replace(/\.[^/.]+$/, "") + "-context.json";

    var code = (function () {

        var contextData = {};
        if (fs.existsSync(ctx)) {
            console.log("Found context file: " + ctx);
            var contextData = JSON.parse(fs.readFileSync(ctx, "utf-8"));
        }
        var data = fs.readFileSync(filename, "utf-8");
        var aast = Shade.parseAndInferenceExpression(data, contextData);
        return new GLSLCompiler().compileFragmentShader(aast);
    }());

    if (args.p) {
        console.log(code);
    } else {
        console.log(code);

    }

}(argv));