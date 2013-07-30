(function (ns) {
    /**
     * Shade.js specific type inference that is also inferring
     * virtual types {@link Shade.TYPES }
     */

    var walk = require('estraverse'),
        enterExpression = require('./infer_expression.js').enterExpression,
        exitExpression = require('./infer_expression.js').exitExpression,
        enterStatement = require('./infer_statement.js').enterStatement,
        exitStatement = require('./infer_statement.js').exitStatement,
        Context = require("./context.js").Context,
        MathObject = require("./registry/math.js"),
        ColorObject = require("./registry/color.js"),
        ShadeObject = require("./registry/shade.js")


    var Syntax = walk.Syntax;


    var enterNode = function(ctx, node, parent) {
        return switchKind(node, parent, ctx, enterStatement, enterExpression);
    }

    var exitNode = function(ctx, node, parent) {
        return switchKind(node, parent, ctx, exitStatement, exitExpression);
    }

    var switchKind = function(node, parent, ctx, statement, expression) {
        switch (node.type) {
            case Syntax.BlockStatement:
            case Syntax.BreakStatement:
            case Syntax.CatchClause:
            case Syntax.ContinueStatement:
            case Syntax.DirectiveStatement:
            case Syntax.DoWhileStatement:
            case Syntax.DebuggerStatement:
            case Syntax.EmptyStatement:
            case Syntax.ExpressionStatement:
            case Syntax.ForStatement:
            case Syntax.ForInStatement:
            case Syntax.FunctionDeclaration:
            case Syntax.IfStatement:
            case Syntax.LabeledStatement:
            case Syntax.Program:
            case Syntax.ReturnStatement:
            case Syntax.SwitchStatement:
            case Syntax.SwitchCase:
            case Syntax.ThrowStatement:
            case Syntax.TryStatement:
            case Syntax.VariableDeclaration:
            case Syntax.VariableDeclarator:
            case Syntax.WhileStatement:
            case Syntax.WithStatement:
                return statement(node, parent, ctx);

            case Syntax.AssignmentExpression:
            case Syntax.ArrayExpression:
            case Syntax.ArrayPattern:
            case Syntax.BinaryExpression:
            case Syntax.CallExpression:
            case Syntax.ConditionalExpression:
            case Syntax.FunctionExpression:
            case Syntax.Identifier:
            case Syntax.Literal:
            case Syntax.LogicalExpression:
            case Syntax.MemberExpression:
            case Syntax.NewExpression:
            case Syntax.ObjectExpression:
            case Syntax.ObjectPattern:
            case Syntax.Property:
            case Syntax.SequenceExpression:
            case Syntax.ThisExpression:
            case Syntax.UnaryExpression:
            case Syntax.UpdateExpression:
            case Syntax.YieldExpression:
                return expression(node, parent, ctx);

            default:
                throw new Error('Unknown node type: ' + node.type);
        }
    }


    var registerGlobalContext = function(program, variables) {
        var ctx = new Context(program, null, { variables: variables, name: "global" });
        ctx.registerObject("Math", MathObject);
        ctx.registerObject("Color", ColorObject);
        ctx.registerObject("Shade", ShadeObject);
        return ctx;
    }


    var infer = function(ast, variables) {
        variables && variables.env && (variables.env.global = true);

        var ctx = null;
        if (ast.type == Syntax.Program) {
            ctx = registerGlobalContext(ast, variables);
        }

        walk.traverse(ast, {
            enter: enterNode.bind(this, ctx),
            leave: exitNode.bind(this, ctx)
        });
        return ast;
    };



    ns.infer = infer;


}(exports));
