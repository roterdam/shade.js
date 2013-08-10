(function (ns) {

    var Base = require("../../base/index.js");

    var Transformer = require("./transform.js").GLASTTransformer;
    var generate = require("./glsl-generate.js").generate;

    var GLSLCompiler = function () {

    };

    Base.extend(GLSLCompiler.prototype, {

        compileFragmentShader: function (aast, opt) {

            var transformer = new Transformer("global.shade");
            var transformed = transformer.transformAAST(aast);

            var code = generate(transformed, opt);

            return code;
        }

    });


    ns.GLSLCompiler = GLSLCompiler;

}(exports));
