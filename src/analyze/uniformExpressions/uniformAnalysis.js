(function (ns) {

    // Dependencies
    var common = require("../../base/common.js");
    var esgraph = require('esgraph');
    var worklist = require('analyses');
    var evaluator = require('./evaluator.js');
    var transformer = require('./uniformTransformer.js');
    var Tools = require("../settools.js");
    var assert = require("assert");

    // Shortcuts
    var Set = worklist.Set,
        Syntax = common.Syntax;

    /**
     * @param root
     * @param opt
     * @constructor
     */
    function UniformAnalysis(root, opt) {
        this.root = root;
        this.opt = opt || {};
    }


    UniformAnalysis.prototype = {
        analyzeBody: function (body) {
            var cfg = esgraph(body, { omitExceptions: true });


            var result = worklist(cfg,
            /**
             * @param {Set} input
             * @this {FlowNode}
             * @returns {*}
             */
                function (input) {

                if (!this.astNode || this.type) // Start and end node do not influence the result
                    return input;

                var generate = evaluator.generateUniformExpressions(this.astNode, input);
                this.kill = this.kill || Tools.findVariableAssignments(this.astNode, true);

                var filteredInput = input;
                if (this.kill.size) {
                    var that = this;
                    filteredInput = new Set(input.filter(function (elem) {
                            return !that.kill.some(function(tokill) { return elem.name == tokill });
                    }));
                }

                var result = Set.union(filteredInput, generate);

//                console.log("input:", input);
//                console.log("kill:", this.kill);
//                console.log("generate:", generate);
//                console.log("filteredInput:", filteredInput);
//                //console.log("result:", result);
                return result;
                }, {
                direction: 'forward',
                merge: worklist.merge(function(a,b) {
                    if (!a && !b)
                        return null;
                    return Set.intersect(a, b);
                })
            });
            //Tools.printMap(result, cfg);

        },

        transform: function () {
            var result = transformer.transform(this.root, this.opt);
            return result;
        }
    };


    ns.extract = function (ast, opt) {

        assert(ast.type == Syntax.Program || ast.type == Syntax.BlockStatement);

        var analysis = new UniformAnalysis(ast, opt);

        // Propagate and analyze
        analysis.analyzeBody(ast.type == Syntax.Program ? ast.body : ast);

        // Transform
        return analysis.transform();
    };


}(exports));
