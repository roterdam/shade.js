(function(ns){

    var Shade = require("../../../interfaces.js"),
        TYPES = Shade.TYPES,
        KINDS = Shade.OBJECT_KINDS,
        Tools = require("./tools.js");

    var Vector3Constructor =  {
        type: TYPES.OBJECT,
        kind: KINDS.FLOAT3,
        /**
         * @param {Annotation} result
         * @param {Array.<Annotation>} args
         * @param {Context} ctx
         */
        evaluate: Tools.Vec.constructorEvaluate.bind(null, "Vec3", 3),
        computeStaticValue: Tools.Vec.constructorComputeStaticValue.bind(null, "Vec3")

    };

    var Vector3StaticObject = {
    };

    var Vector3Instance = {
        length: {
            type: TYPES.FUNCTION,
            evaluate: Tools.Vec.optionalZeroEvaluate.bind(null,"Vec3", "length", 3, 1, 1)
        }
    };
    Tools.Vec.attachSwizzles(Vector3Instance, "Vec3", 3);
    Tools.Vec.attachVecMethods(Vector3Instance, "Vec3", 3, 3, ['add', 'sub', 'mul', 'div', 'mod', 'reflect', "cross"]);
    Tools.Vec.attachVecMethods(Vector3Instance, "Vec3", 1, 3, ['dot']);
    Tools.Vec.attachVecMethods(Vector3Instance, "Vec3", 3, 0, ['normalize', 'flip']);

    Vector3Instance["refract"] = {
        type: TYPES.FUNCTION,
        evaluate: function (result, args, ctx) {
            if (args.length < 2)
                Shade.throwError(result.node, "Not enough parameters for refract.");

            var eta = args.pop();
            if (!eta || !eta.canNumber())
                Shade.throwError(result.node, "Invalid parameter for refract, expected a number got " + eta.getTypeString());

            Tools.Vec.checkVecArguments(Vector3Instance + "." + "refract", 3, false, 0, result, args);

            var typeInfo = {
                type: TYPES.OBJECT,
                kind: KINDS.FLOAT3
            };

            return typeInfo;
        }
    };

    Tools.extend(ns, {
        id: "Vec3",
        kind: KINDS.FLOAT3,
        object: {
            constructor: Vector3Constructor,
            static: Vector3StaticObject
        },
        instance: Vector3Instance
    });


}(exports));
