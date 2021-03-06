/**
 *
 * @param env Parameters from the current environment
 * @param env.texcoord {Point} Texture coordinates
 * @param env.frequency {number} Frequency of the checkerboard pattern
 * @param env.whiteColor {Color} Light color of the checkerboard
 * @param env.blackColor {Color} Dark color of the checkerboard
 * @param env.normal {Normal} Surface normal
 * @param env.shininess {number} Roughness of the surface
 * @return {*}
 */
function shade(env) {

    var smod = (env.texcoord.x() * env.frequency) % 1.0,
        tmod = (env.texcoord.y() * env.frequency) % 1.0;

    if (this.fwidth) {
        var width = this.fwidth(env.texcoord);
    }

    var color = ((smod < 0.5 && tmod < 0.5) || (smod >= 0.5 && tmod >= 0.5)) ?
        env.whiteColor:
        env.blackColor;

    //return new Shade().diffuse(color, env.normal).phong(new Vec3(0.8), env.normal, env.shininess);
    return new Shade().diffuse(color, env.normal);
    //return color;
}
