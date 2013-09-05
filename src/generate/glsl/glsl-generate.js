(function (ns) {

    var FunctionAnnotation = require("./../../base/annotation.js").FunctionAnnotation;
    var Shade = require("./../../interfaces.js");
    var walk = require('estraverse'),
        Syntax = walk.Syntax,
        VisitorOption = walk.VisitorOption,
        ANNO = require("../../base/annotation.js").ANNO;

    var Types = Shade.TYPES,
        Kinds = Shade.OBJECT_KINDS,
        Sources = Shade.SOURCES;

    var InternalFunctions = {
        "MatCol" : function(name, details){
            var matType = details.matType,
                colType = details.colType;
            return [matType + " " + name + "(" + matType + " mat, int idx, " + colType + " value){",
                  "  " + matType + " result = " + matType + "(mat);",
                  "  result[idx] = value;",
                  "  return result;",
                  "}"];
        }
    }

    var GLSL = {
        Storage: {
            CONST: "const",
            UNIFORM: "uniform",
            VARYING: "varying",
            ATTRIBUTE: "attribtue"
        }
    }


    /**
     * @param {object} opt
     */
    var getHeader = function (opt) {
        if (opt.omitHeader == true)
            return [];
        var header = [
            "// Generated by shade.js"
        ];
        var floatPrecision = opt.floatPrecision || "mediump";
        header.push("precision " + floatPrecision + " float;");
        return header;
    }

    var toGLSLType = function (info, allowUndefined) {
        if(!info) return "?";

        switch (info.type) {
            case Types.OBJECT:
                switch (info.kind) {
                    case Kinds.FLOAT4:
                        return "vec4";
                    case Kinds.FLOAT3:
                        return "vec3";
                    case Kinds.FLOAT2:
                        return "vec2";
                    case Kinds.TEXTURE:
                        return "sampler2D";
                    case Kinds.MATRIX3:
                        return "mat3";
                    case Kinds.MATRIX3:
                        return "mat4";
                    case Kinds.COLOR_CLOSURE:
                        return "vec4";
                    default:
                        return "<undefined>";
                }
            case Types.ARRAY:
                return toGLSLType(info.elements);

            case Types.UNDEFINED:
                if (allowUndefined)
                    return "void";
                throw new Error("Could not determine type");
            case Types.NUMBER:
                return "float";
            case Types.BOOLEAN:
                return "bool";
            case Types.INT:
                return "int";
            case Types.BOOLEAN:
                return "bool";
            default:
                //throw new Error("toGLSLType: Unhandled type: " + info.type);
                return info.type;

        }
    }

    var toGLSLStorage = function(info) {
        if (!info.source)
            return null;
        if (info.source == Sources.VERTEX)
            return GLSL.Storage.VARYING;
        if (info.source == Sources.UNIFORM)
            return GLSL.Storage.UNIFORM;
        if (info.source == Sources.CONSTANT)
            return GLSL.Storage.CONST;
        throw new Error("toGLSLSource: Unhandled type: " + info.source);
    }

    function createLineStack() {
        var arr = [];
        arr.push.apply(arr, arguments);
        var indent = "";
        arr.appendLine = function(line){
            line ? this.push(indent + line) : this.push("");
        };
        arr.changeIndention = function(add){
            while(add > 0){
                indent += "    "; add--;
            }
            if(add < 0){
                indent = indent.substr(0, indent.length + add*4);
            }
        };
        arr.append = function(str){
            this[this.length-1] = this[this.length-1] + str;
        };
        return arr;
    };


    /*Base.extend(LineStack.prototype, {

    });*/

    var generate = function (ast, opt) {

        opt = opt || {};

        var lines = createLineStack();

        traverse(ast, lines, opt);

        return lines.join("\n");
    }

    function appendInternalFunctions(lines, internalFunctions){
        if(!internalFunctions) return;
        for(var key in internalFunctions){
            var entry = internalFunctions[key];
            if(InternalFunctions[entry.type]){
                var linesToAdd = InternalFunctions[entry.type](entry.name, entry.details);
                lines.push.apply(lines, linesToAdd);
            }
            else{
                throw Error("Internal: InlineFunction of type '" + entry.type + "' not available!");
            }
        }
    }

    function traverse(ast, lines, opt) {
        var insideMain = false;


        walk.traverse(ast, {
                enter: function (node) {
                    try {
                        var type = node.type;
                        switch (type) {

                            case Syntax.Program:
                                getHeader(opt).forEach(function (e) {
                                    lines.push(e)
                                });
                                appendInternalFunctions(lines, ANNO(ast).getUserData().internalFunctions);
                                break;


                            case Syntax.FunctionDeclaration:
                                opt.newLines && lines.appendLine();
                                var func = new FunctionAnnotation(node);
                                var methodStart = [toGLSLType(func.getReturnInfo(), true)];
                                methodStart.push(node.id.name, '(');
                                if(node.id.name == "main")
                                    insideMain = true;

                                if (!(node.params && node.params.length)) {
                                    methodStart.push("void");
                                } else {
                                    var methodArgs = [];
                                    node.params.forEach(function (param) {
                                        methodArgs.push(toGLSLType(param.extra)+ " " + param.name);
                                    })
                                    methodStart.push(methodArgs.join(", "));
                                }
                                methodStart.push(') {');
                                lines.appendLine(methodStart.join(" "));
                                lines.changeIndention(1);
                                return;


                            case Syntax.ReturnStatement:
                                var hasArguments = node.argument;
                                lines.appendLine("return " + (hasArguments ? handleExpression(node.argument, opt) : "") + ";");
                                return;

                            case Syntax.VariableDeclarator :
                                // console.log("Meep!");
                                var decl = handleVariableDeclaration(node, insideMain, opt);
                                lines.appendLine(decl);
                                return;

                            case Syntax.AssignmentExpression:
                                lines.appendLine(handleExpression(node, opt) + ";")
                                return;

                            case Syntax.ExpressionStatement:
                                lines.appendLine(handleExpression(node.expression, opt) + ";");
                                return VisitorOption.Skip;

                            case Syntax.IfStatement:
                                lines.appendLine("if(" + handleExpression(node.test, opt) + ") {");

                                lines.changeIndention(1);
                                traverse(node.consequent, lines, opt);
                                lines.changeIndention(-1);

                                if (node.alternate) {
                                    lines.appendLine("} else {");
                                    lines.changeIndention(1);
                                    traverse(node.alternate, lines, opt);
                                    lines.changeIndention(-1);
                                }
                                lines.appendLine("}");
                                return VisitorOption.Skip;

                            case Syntax.ForStatement:
                                lines.appendLine("for (" + handleInlineDeclaration(node.init, opt) + "; " + handleExpression(node.test, opt) +"; " + handleExpression(node.update, opt) + ") {");
                                lines.changeIndention(1);
                                traverse(node.body, lines, opt);
                                lines.changeIndention(-1);
                                lines.appendLine("}");
                                return VisitorOption.Skip;

                            case Syntax.ContinueStatement:
                                lines.appendLine("continue;");


                            default:
                            //console.log("Unhandled: " + type);

                        }
                    } catch (e) {
                        console.error(e);
                        Shade.throwError(node, e.message);
                    }
                },
                leave: function (node) {
                    var type = node.type;
                    switch (type) {
                        case Syntax.Program:
                            break;
                        case Syntax.FunctionDeclaration:
                            lines.changeIndention(-1);
                            lines.appendLine("}");
                            break;
                    }
                }
            }
        );
    }

    var generateFloat = function(value) {
        if(isNaN(value))
            throw Error("Internal: Expression generated NaN!");
        var result = '' + value;
        if (result.indexOf(".") == -1) {
            result += ".0";
        }
        return result;
    }

    /**
     *
     * @param node
     * @returns {string}
     */
    var handleExpression = function(node, opt) {
        var result = "<unhandled: " + node.type+ ">",
            opt = opt || {};

        if(opt.useStatic && node.extra && node.extra.staticValue) {
            return handleStaticValue(node);
        }

        switch(node.type) {
            case Syntax.NewExpression:
                result = toGLSLType(node.extra);
                result += handleArguments(node.arguments, opt);
                break;

            case Syntax.Literal:
                result = handleLiteral(node.extra, node.value);
                break;


            case Syntax.Identifier:
                result = node.name;
                break;

            case Syntax.BinaryExpression:
            case Syntax.LogicalExpression:
            case Syntax.AssignmentExpression:
                result = handleBinaryArgument(node.left, opt);
                result += " " + node.operator + " ";
                result += handleBinaryArgument(node.right, opt);
                break;
            case Syntax.UnaryExpression:
                result = node.operator;
                result += handleBinaryArgument(node.argument, opt);
                break;

            case Syntax.CallExpression:
                result = handleExpression(node.callee, opt);
                result += handleArguments(node.arguments, opt);
                break;

            case Syntax.MemberExpression:
                result = handleBinaryArgument(node.object, opt);
                result += node.computed ? "[" : ".";
                result += handleExpression(node.property, opt);
                node.computed && (result += "]");
                break;

            case Syntax.ConditionalExpression:
                result = handleExpression(node.test, opt);
                result += " ? ";
                result += handleExpression(node.consequent, opt);
                result += " : ";
                result += handleExpression(node.alternate, opt);
                break;

            case Syntax.UpdateExpression:
                result = "";
                if (node.isPrefix) {
                    result += node.operator;
                }
                result += handleExpression(node.argument, opt);
                if (!node.isPrefix) {
                    result += node.operator;
                }
            default:
                //console.log("Unhandled: " , node.type);
        }
        return result;
    }

    function getStaticValue(extra) {
        if (!extra || !extra.staticValue) return "";
        return extra.staticValue;
    };

    function handleVariableDeclaration(node, writeStorageQualifier, opt) {
        var storageQualifier = !writeStorageQualifier ? toGLSLStorage(node.extra) : null;
        var result = storageQualifier ? storageQualifier + " " : "";
        result += toGLSLType(node.extra) + " " + node.id.name;
        if (node.extra.elements) {
            result += "[" + (node.extra.staticSize ? node.extra.staticSize : "0") + "]";
        }
        if (node.init) result += " = " + handleExpression(node.init, opt);
        if (!node.init && storageQualifier == GLSL.Storage.CONST) {
            result += " = " + getStaticValue(node.extra);
        }
        return result + ";";
    }


    function handleInlineDeclaration(node, opt) {
        if (node.type != Syntax.VariableDeclaration)
            Shade.throwError(node, "Internal error in GLSL::handleInlineDeclaration");
        var result = node.declarations.reduce(function(declString, declaration){
            var decl = toGLSLType(declaration.extra) + " " + declaration.id.name;
            if (declaration.init) {
                decl += " = " + handleExpression(declaration.init, opt);
            }
            return declString + decl;
        }, "");
        return result;
    }

    function handleBinaryArgument(node, opt){
        var result = handleExpression(node, opt);
        switch(node.type) {
            case Syntax.BinaryExpression:
            case Syntax.LogicalExpression:
            case Syntax.AssignmentExpression: result = "( " + result + " )"; break;
        }
        return result;
    }

    function handleArguments(container, opt) {
        var result = "(";
        container.forEach(function (arg, index) {
            result += handleExpression(arg, opt);
            if (index < container.length - 1) {
                result += ", ";
            }
        });
        return result + ")";
    }

    function handleStaticValue(node) {
        var result = "unhandled static value: " + node.type;
        switch(node.extra.type) {
            case Types.NUMBER:
            case Types.INT:
            case Types.BOOLEAN:
                result = handleLiteral(node.extra);
                break;

            case Types.OBJECT:
                var staticValue = node.extra.staticValue;
                switch(node.extra.kind) {
                    case Kinds.FLOAT2:
                        result = "vec2(" + staticValue.r() + ", " + staticValue.g() + ")";
                        break;
                    case Kinds.FLOAT3:
                        result = "vec3(" + staticValue.r() + ", " + staticValue.g() + ", " + staticValue.b() + ")";
                        break;
                    case Kinds.FLOAT4:
                        result = "vec4(" + staticValue.r() + ", " + staticValue.g() + ", " + staticValue.b() + ", " + staticValue.a() + ")";
                        break;
                    default:
                        Shade.throwError(node, "Internal: Can't generate static GLSL value for kind: " + node.extra.kind);
                }
                break;
            default:
                Shade.throwError(node, "Internal: Can't generate static GLSL value for type: " + node.extra.type);

        }
        return result;
    }

    function handleLiteral(extra, alternative) {
        var value = extra.staticValue !== undefined ? extra.staticValue : alternative;
        if (extra.type == Types.NUMBER)
            return generateFloat(value);
        else
            return value;
    }

    exports.generate = generate;


}(exports));
