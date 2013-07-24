(function (ns) {

    var Syntax = require('estraverse').Syntax;
    var Shade = require("../../interfaces.js").Shade;

    var TYPES = Shade.TYPES;


    var enterStatement = function (node) {

        return;


    };

    var exitStatement = function (node) {

        switch (node.type) {
            case Syntax.ExpressionStatement:
                // console.log("exp:", node);
                node.result = node.expression.result;

                break;
            case Syntax.BlockStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.BreakStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.CatchClause:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.ContinueStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.DirectiveStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.DoWhileStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.DebuggerStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.EmptyStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.ForStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.ForInStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.FunctionDeclaration:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.IfStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.LabeledStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.Program:
                break;
            case Syntax.ReturnStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.SwitchStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.SwitchCase:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.ThrowStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.TryStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.VariableDeclaration:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.VariableDeclarator:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.WhileStatement:
                console.log(node.type + " is not handle yet.");
                break;
            case Syntax.WithStatement:
                console.log(node.type + " is not handle yet.");
                break;
            default:
                throw new Error('Unknown node type: ' + node.type);
        }

    };

    ns.enterStatement = enterStatement;
    ns.exitStatement = exitStatement;
}(exports));
