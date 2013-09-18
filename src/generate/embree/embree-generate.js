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

    var Embree = {
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
            "// Generated by shade.js",
            "#ifndef __EMBREE_SHADEJS_MATERIAL_H__",
            "#define __EMBREE_SHADEJS_MATERIAL_H__",

            "#include \"../materials/material.h\"",
            "#include \"../brdfs/lambertian.h\"",
//            "#include \"../brdfs/shadejs.h\"",
            "#include \"../textures/texture.h\"",
            "",
            "namespace embree",
            "{"
        ];
        if (opt.headers)
            header = header.concat(opt.headers)
        return header;
    }

    var getEpilog = function(opt) {
        var epilog = [
            "} // namespace embree",
            "#endif"
        ];
        return epilog;
    }

    var generateProlog = function(ast, lines, opt) {
        getHeader(opt).forEach(function(e) { lines.push(e) });

        var classHeader = [
            "class ShadeJSMaterial : public Material",
            "{",
            "public:",
            "",
            "    static float mod(float a, float b)",
            "    {",
            "        // From Texturing & Modeling (a procedural approach) David S. Ebert",
            "        int n = (int)(a/b);",
            "        a -= n*b;",
            "        if (a < 0)",
            "          a += b;",
            "        return a;",
            "    }",
            "",
            "    static float fract(float f)",
            "    {",
            "        // return modf(f, 0);",
            "        return f - floor(f);",
            "    }",
            "",
            "    static Vec2f fract(const Vec2f &v)",
            "    {",
            "        return Vec2f(fract(v.x), fract(v.y));",
            "    }",
            "",
            "    static Vec4f fract(const Vec4f &v)",
            "    {",
            "        return Vec4f(fract(v.x), fract(v.y), fract(v.z), fract(v.w));",
            "    }",
            "",
            "    static float floor(float f)",
            "    {",
            "        return floorf(f);",
            "    }",
            "",
            "    static Vec2f floor(const Vec2f &v)",
            "    {",
            "        return Vec2f(floorf(v.x), floorf(v.y));",
            "    }",
            "",
            "    static Vec2f st(const Vec2f &v)",
            "    {",
            "        return v;",
            "    }",
            "",
            "    static Vec2f ts(const Vec2f &v)",
            "    {",
            "        return Vec2f(v.y, v.x);",
            "    }",
            "",
            "    static float sin(float v)",
            "    {",
            "        return sinf(v);",
            "    }",
            "",
            "    static Vec4f sin(const Vec4f &v)",
            "    {",
            "        return Vec4f(sin(v.x), sin(v.y), sin(v.z), sin(v.w));",
            "    }",
            "",
            "    static float mix(float x, float y, float alpha) {",
            "      return x*(1.0f - alpha) + y*alpha;",
            "    }",
            "",
            "    static Vec2f mix(const Vec2f &x, const Vec2f &y, float alpha)",
            "    {",
            "      return x*(1.0f - alpha) + y*alpha;",
            "    }",
            "",
            "    static Vector3f mix(const Vector3f &x, const Vector3f &y, float alpha)",
            "    {",
            "      return x*(1.0f - alpha) + y*alpha;",
            "    }",
            "",
            "    static float pow(float x, float y)",
            "    {",
            "        return powf(x, y);",
            "    }",
            "",
            "    static Vector3f pow(const Vector3f &x, const Vector3f &y)",
            "    {",
            "        return Vector3f(pow(x.x, y.x), pow(x.y, y.y), pow(x.z, y.z));",
            "    }",
            "",
            "    static Vec4f pow(const Vec4f &x, const Vec4f &y)",
            "    {",
            "        return Vec4f(pow(x.x, y.x), pow(x.y, y.y), pow(x.z, y.z), pow(x.w, y.w));",
            "    }",
            "",
            "    static float step(float min, float value)",
            "    {",
            "        return value < min ? 0.0f : 1.0f;",
            "    }",
            "",
            "    /*",
            "      SmoothStep returns 0 if value is less than min, 1 if value is greater than",
            "      or equal to max, and performs a smooth Hermite interpolation between",
            "      0 and 1 in the interval min to max.",
            "    */",
            "    static float smoothstep(float min, float max, float value)",
            "    {",
            "        if (value < min) return 0.0f;",
            "        if (value >= max) return 1.0f;",
            "",
            "        float v = (value - min) / (max - min);",
            "        return (-2.0f * v + 3.0f) * v * v;",
            "    }",
            "",
            "    static float clamp(float val, float low, float high)",
            "    {",
            "        return val < low ? low : (val > high ? high : val);",
            "    }",
            "",
            "    static Vec2f clamp(const Vec2f &val,const Vec2f &low, const Vec2f &high)",
            "    {",
            "        return Vec2f(clamp(val.x, low.x, high.x), clamp(val.y, low.y, high.y));",
            "    }",
            "",
            "    static Vector3f clamp(const Vector3f &val,const Vector3f &low, const Vector3f &high)",
            "    {",
            "        return Vector3f(clamp(val.x, low.x, high.x),",
            "            clamp(val.y, low.y, high.y),",
            "            clamp(val.z, low.z, high.z));",
            "    }",
            "",
            "    static Color toColor(const Vector3f &vec)",
            "    {",
            "        return Color(vec.x, vec.y, vec.z);",
            "    }",
            "",
            "    /*! Constant BRDF. */",
            "    class ConstantColor : public BRDF",
            "    {",
            "    public:",
            "      /*! ConstantColor BRDF constructor. This is a diffuse reflection BRDF. */",
            "      __forceinline ConstantColor(const Color& C, const BRDFType type=DIFFUSE_REFLECTION) : BRDF(type), C(C) {}",
            "",
            "      __forceinline Color eval(const Vector3f& wo, const DifferentialGeometry& dg, const Vector3f& wi) const {",
            "        return C;",
            "      }",
            "",
            "      Color sample(const Vector3f& wo, const DifferentialGeometry& dg, Sample3f& wi, const Vec2f& s) const {",
            "        return eval(wo, dg, wi = cosineSampleHemisphere(s.x,s.y,dg.Ns));",
            "      }",
            "",
            "      float pdf(const Vector3f& wo, const DifferentialGeometry& dg, const Vector3f& wi) const {",
            "        //return cosineSampleHemispherePDF(wi,dg.Ns);",
            "        return zero;",
            "      }",
            "",
            "    private:",
            "",
            "      Color C;",
            "    };",
            "",
            "    struct BRDFClosure",
            "    {",
            "        CompositedBRDF& brdfs;",
            "",
            "        BRDFClosure(CompositedBRDF& brdfs) : brdfs(brdfs) { }",
            "",
            "        BRDFClosure &diffuse(const Vector3f &color, const Vector3f &normal)",
            "        {",
            "            brdfs.add(NEW_BRDF(Lambertian)(toColor(color)));",
            "            return *this;",
            "        }",
            "",
            "        BRDFClosure &phong(const Vector3f &color, const Vector3f &normal, float shininess)",
            "        {",
            "            // TODO implement this",
            "            return *this;",
            "        }",
            "    };",
            "",
            "    static void addClosureToBRDFs(CompositedBRDF& brdfs, Color color)",
            "    {",
            "        brdfs.add(NEW_BRDF(ConstantColor)(color));",
            "    }",
            "",
            "    static void addClosureToBRDFs(CompositedBRDF& brdfs, const BRDFClosure &closure)",
            "    {",
            "        if (&brdfs == &closure.brdfs)",
            "            return;",
            "        for (size_t i = 0; i < closure.brdfs.size(); ++i)",
            "        {",
            "            brdfs.add(closure.brdfs[i]);",
            "        }",
            "    }",
            ""
        ]

        classHeader.forEach(function(e) { lines.appendLine(e); });

        generateConstructor(ast.globals, lines);

        lines.changeIndention(1); // for members
    }

    var generateEpilog = function(ast, lines, opt) {
        lines.changeIndention(-1); // for members

        generateMemberVars(ast.globals, lines);
        lines.changeIndention(-1);
        lines.appendLine("}; // ShadeJSMaterial");
        getEpilog(opt).forEach(function(e) { lines.push(e) });
    }

    var generateConstructor = function(globals, lines) {
        lines.changeIndention(1);
        lines.appendLine("ShadeJSMaterial(const Parms& parms)");
        lines.appendLine("{");
        lines.changeIndention(1);
        for (var i in globals) {
            var declarations = globals[i].declarations;

            for (var j in declarations) {
                var decl = declarations[j];
                // decl.extra.propertName is set in transform.js
                var name = decl.extra.propertyName || decl.id.name;
                var line = decl.id.name + " = parms." + getEmbreeParamGetter(decl.extra) + "(\"" + name + "\"";
                if (decl.init) {
                    line += "," + handleExpression(decl.init);
                }
                lines.appendLine(line + ");");
            }
        }
        lines.changeIndention(-1);
        lines.appendLine("}");
        lines.appendLine("");
        lines.changeIndention(-1);
    }

    var generateMemberVars = function(globals, lines) {
        lines.appendLine("protected:");
        lines.changeIndention(1);
        for (var i in globals) {
            var declarations = globals[i].declarations;

            for (var j in declarations) {
                var decl = declarations[j];

                var line = toEmbreeType(decl.extra) + " " + decl.id.name;
                lines.appendLine(line + ";");
            }
        }
    }

    var getEmbreeParamGetter = function(info) {
        switch (info.type) {
            case Types.OBJECT:
                switch (info.kind) {
                    case Kinds.COLOR:
                        return "getColor";
                    case Kinds.FLOAT3:
                        return "getVector3f";
                    case Kinds.FLOAT2:
                        return "getVec2f";
                    default:
                        return "<undefined>";
                }
            case Types.UNDEFINED:
                return "void";
            case Types.NUMBER:
                return "getFloat";
            case Types.INT:
                return "getInt";
            default:
                throw new Error("getEmbreeParamGetter: Unhandled type: " + info.type);
        }
    }

    var isIntegralType = function(info) {
        if (!info)
            return false;
        return info.type == Types.NUMBER || info.type == Types.INT || info.type == Types.BOOLEAN;
    }

    var isConstructorRequireFloats = function(info) {
        if (!info)
            return false;
        switch (info.type) {
            case Types.OBJECT:
                switch (info.kind) {
                    case Kinds.FLOAT2:
                    case Kinds.FLOAT3:
                    case Kinds.FLOAT4:
                    case Kinds.COLOR_CLOSURE:
                        return true;
                    default:
                        return false;
                }
            case Types.ARRAY:
                return isConstructorRequireFloats(info.elements);
            case Types.NUMBER:
                return true;
            case Types.UNDEFINED:
            case Types.INT:
            case Types.BOOLEAN:
                return false;
            default:
                //throw new Error("toEmbreeType: Unhandled type: " + info.type);
                return false;
        }
    }

    var toEmbreeType = function (info, allowUndefined) {
        if (!info)
            return "?";
        if (info.cxxType)
            return info.cxxType;
        switch (info.type) {
            case Types.OBJECT:
                switch (info.kind) {
                    case Kinds.FLOAT3:
                        return "Vector3f";
                    case Kinds.FLOAT2:
                        return "Vec2f";
                    case Kinds.COLOR_CLOSURE:
                        return "Vec4f";
                    case Kinds.FLOAT4:
                        return "Vec4f";
                    default:
                        return "<undefined>";
                }
            case Types.ARRAY:
                return toEmbreeType(info.elements);

            case Types.UNDEFINED:
                if (allowUndefined)
                    return "void";
                throw new Error("Could not determine type");
            case Types.NUMBER:
                return "float";
            case Types.INT:
                return "int";
            case Types.BOOLEAN:
                return "bool";
            default:
                //throw new Error("toEmbreeType: Unhandled type: " + info.type);
                return info.type;

        }
    }

    var toEmbreeStorage = function(info) {
        if (!info.source)
            return null;
        if (info.source == Sources.VERTEX)
            return Embree.Storage.VARYING;
        if (info.source == Sources.UNIFORM)
            return Embree.Storage.UNIFORM;
        if (info.source == Sources.CONSTANT)
            return Embree.Storage.CONST;
        throw new Error("toEmbreeStorage: Unhandled type: " + info.source);
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
        opt.insideFunction = opt.insideFunction || false;

        walk.traverse(ast, {
                enter: function (node) {
                    try {
                        var type = node.type;
                        switch (type) {

                            case Syntax.Program:
                                generateProlog(ast, lines, opt);
                                appendInternalFunctions(lines, ANNO(ast).getUserData().internalFunctions);
                                break;


                            case Syntax.FunctionDeclaration:
                                opt.newLines && lines.appendLine();
                                var func = new FunctionAnnotation(node);
                                var methodStart = [toEmbreeType(func.getReturnInfo(), true)];
                                methodStart.push(node.id.name, '(');
                                opt.insideFunction = true;

                                if (!(node.params && node.params.length)) {
									methodStart.push("void");
                                } else {
                                    var methodArgs = [];
                                    node.params.forEach(function (param) {
                                        methodArgs.push(toEmbreeType(param.extra) + " " + param.name);
                                    })
                                    methodStart.push(methodArgs.join(", "));
                                }
                                methodStart.push(") const {");
                                //if (node.extra.cxxModifier) {
                                //    methodStart.push(') '+node.extra.cxxModifier+" {");
                                //}
                                //else
                                //    methodStart.push(') {');
                                lines.appendLine(methodStart.join(" "));
                                lines.changeIndention(1);
                                return;


                            case Syntax.ReturnStatement:
                                var hasArguments = node.argument;
                                lines.appendLine("return" + (hasArguments ? (" " + handleExpression(node.argument, opt)) : "") + ";");
                                return;

                            case Syntax.VariableDeclarator :
                                // console.log("Meep!");
                                var decl = handleVariableDeclaration(node, !opt.insideFunction, opt);
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
                        // console.error(e);
                        Shade.throwError(node, e.message);
                    }
                },
                leave: function (node) {
                    var type = node.type;
                    switch (type) {
                        case Syntax.Program:
                            generateEpilog(ast, lines, opt);
                            break;
                        case Syntax.FunctionDeclaration:
                            opt.insideFunction = false;
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
        if (result.indexOf(".") == -1 && result.indexOf("e") == -1) {
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
                var convertToFloats = isConstructorRequireFloats(node.extra);
                result = toEmbreeType(node.extra);
                result += handleArguments(node.arguments, opt, convertToFloats);
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
        if (!extra || extra.staticValue === undefined) return "";
        return extra.staticValue;
    };

    function handleVariableDeclaration(node, writeStorageQualifier, opt) {
        //var storageQualifier = !writeStorageQualifier ? toEmbreeStorage(node.extra) : null;
        var storageQualifier = "";
        if (writeStorageQualifier) {
            if (isIntegralType(node.extra)) {
                storageQualifier = "static const";
            } else {
                var result = "#define "+node.id.name+" (";
                if (node.init)
                    result += handleExpression(node.init, opt);
                else
                    result += toEmbreeType(node.extra) + "()";
                result +=")";
                return result;
            }
        }
        var result = storageQualifier ? storageQualifier + " " : "";
        result += toEmbreeType(node.extra) + " " + node.id.name;
        if (node.extra.elements) {
            result += "[" + (node.extra.staticSize ? node.extra.staticSize : "0") + "]";
        }
        if (node.init) result += " = " + handleExpression(node.init, opt);
        if (!node.init && storageQualifier == Embree.Storage.CONST) {
            result += " = " + getStaticValue(node.extra);
        }
        return result + ";";
    }


    function handleInlineDeclaration(node, opt) {
        if (node.type != Syntax.VariableDeclaration)
            Shade.throwError(node, "Internal error in Embree::handleInlineDeclaration");
        var result = node.declarations.reduce(function(declString, declaration){
            var decl = toEmbreeType(declaration.extra) + " " + declaration.id.name;
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

    function handleArguments(container, opt, convertToFloats) {
        var result = "(";
        container.forEach(function (arg, index) {
            var expr = handleExpression(arg, opt);
            if (convertToFloats && (arg.extra.type != Types.NUMBER)) {
                expr.replace(/^\s+|\s+$/g, ''); // trim whitespace
                if (expr == "0")
                    expr = "0.0";
            }
            result += expr;
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
                        Shade.throwError(node, "Internal: Can't generate static Embree value for kind: " + node.extra.kind);
                }
                break;
            default:
                Shade.throwError(node, "Internal: Can't generate static Embree value for type: " + node.extra.type);

        }
        return result;
    }

    function handleLiteral(extra, alternative) {
        var value = extra.staticValue !== undefined ? extra.staticValue : alternative;
        if (extra.type == Types.NUMBER)
            return generateFloat(value);
        else
            return value+'';
    }

    exports.generate = generate;


}(exports));
