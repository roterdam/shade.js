// Basic Space propagation
/*
[
    { "extra": { "type": "object", "kind": "float3" } },
    { "extra": { "type": "object", "kind": "float3" } }
]
 */
/*
{
    "color" : ["OBJECT"],
    "n" : ["VIEW_NORMAL"]
}
 */
function shade(color, n) {
    var normal;
    normal = Space.transformDirection(Space.VIEW, n);
    return color.mul(normal.dot(1,0,0));
}

