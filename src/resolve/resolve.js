(function(ns){

    var ColorClosureMarker = require("./colorclosure-marker.js");

    var Implementations = {};
    Implementations["xml3d-glsl-forward"] = require("./xml3d-glsl-forward/");
    Implementations["xml3d-glsl-deferred"] = require("./xml3d-glsl-deferred/");

    ns.resolveClosuresPreTypeInference = function(aast, implementationName, processingData, opt) {
        if(!implementationName) {
            return aast;
        }
        try {
            var resolverImpl = Implementations[implementationName];
            if(resolverImpl.resolvePreTypeInference){
                ColorClosureMarker.markColorClosures(aast);
                return resolverImpl.resolvePreTypeInference(aast, processingData, opt);
            }
            else
                return aast;
        } catch(e) {
            console.error(e);
        }
        return aast;
    }

    ns.resolveClosuresPostTypeInference = function(aast, implementationName, processingData, opt) {
        if(!implementationName) {
            return aast;
        }
        try {
           var resolverImpl = Implementations[implementationName];
            if(resolverImpl.resolvePostTypeInference)
                return resolverImpl.resolvePostTypeInference(aast, processingData, opt);
            else
                return aast;
        } catch(e) {
            console.error(e);
        }
        return aast;
    }

}(exports));
