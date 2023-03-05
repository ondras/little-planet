export const vs = `#version 300 es
in vec2 position;
out vec2 ndc;

void main(void) {
	ndc = position.xy;
	gl_Position = vec4(ndc, 0, 1);
}
`;

export const fs = `#version 300 es
#define PI 3.1415926538
precision mediump float;

uniform sampler2D texLeft, texRight;
uniform vec2 port;
uniform float pano_fov;
uniform float planet_fov;
uniform float planet_pano_mix;
uniform vec2 rotation;
in vec2 ndc;
out vec4 FragColor;

vec4 textureLookup(vec2 polar) {
	vec2 uv = polar / PI;

	if (uv.x < 0.) {
		uv.x += 1.0;
		return texture(texLeft, uv);
	} else {
		return texture(texRight, uv);
	}
}

vec2 cartesian_to_polar(vec2 cartesian) {
	return vec2(
		atan(cartesian.x, cartesian.y),
		length(cartesian)
	);
}

vec2 polar_to_cartesian(vec2 polar) {
	float phi = polar.x;
	float r = polar.y;
	return vec2(r*sin(phi), r*cos(phi));
}

vec3 cartesian_to_spherical(vec3 cartesian) {
	float r = length(cartesian);

	return vec3(
		atan(cartesian.x, cartesian.z),
		acos(cartesian.y / r),
		r
	);
}

vec3 spherical_to_cartesian(vec3 spherical) {
	float phi = spherical.x;
	float theta = spherical.y;
	float r = spherical.z;

	return vec3(
		r * sin(phi) * sin(theta),
		r            * cos(theta),
		r * cos(phi) * sin(theta)
	);
}

vec3 hybrid_inverse(vec2 polar, float d) {
	float phi = polar.x;
	float r = polar.y;

	float alpha = atan(r/(1.+d));
	float corr = asin(d * sin(alpha));
	float theta = PI - (alpha+corr);

	return vec3(phi, theta, 1);
}

vec3 stereographic_inverse(vec2 polar) {
	float phi = polar.x;
	float r = polar.y;

	return vec3(phi, 2. * atan(1./r), 1);
}

vec3 gnomonic_inverse_cartesian(vec2 ndc) { // ndc -> cartesian
    return normalize(vec3(ndc.x, -1, ndc.y));
}

vec3 gnomonic_inverse_spherical(vec2 polar) { // polar -> spherical
	float phi = polar.x;
	float r = polar.y;
	float theta = PI/2. + atan(1./r);
	return vec3(phi, theta, 1);
}

vec3 rotate_xy(vec3 p, vec2 angle) {
	vec2 c = cos(angle), s = sin(angle);
	p = vec3(p.x, c.y*p.y + s.y*p.z, -s.y*p.y + c.y*p.z);
	return vec3(c.x*p.x + s.x*p.z, p.y, -s.x*p.x + c.x*p.z);
}

vec2 scale_planet(float fov) {
	return tan(fov * 0.25) * (port / min(port.x, port.y));
}

vec2 scale_pano(float hfov) {
	vec2 fov = hfov * vec2(1, 1);
	if (port.x > port.y) {
		fov.y *= port.y/port.x;
	} else {
		fov.x *= port.x/port.y;
	}
	return tan(fov * 0.5);
}

vec3 unproject_hybrid(vec2 ndc) {
	vec2 s_planet = 2.*scale_planet(planet_fov);
	vec2 s_pano = scale_pano(pano_fov);
	vec2 scale = mix(s_planet, s_pano, planet_pano_mix);
	ndc *= scale;

	float d = 1. - planet_pano_mix; // 1 -> 0

	vec2 polar = cartesian_to_polar(ndc);
	vec3 inverted = hybrid_inverse(polar, d);
	vec3 cartesian = spherical_to_cartesian(inverted);
	vec3 rotated = rotate_xy(cartesian, rotation);

	return cartesian_to_spherical(rotated);
}

vec3 unproject_outside(vec2 ndc) {
	ndc *= scale_planet(planet_fov);
//	ndc *= scale_pano(pano_fov / 2.); uncomment to test pano-mode of the stereographical projection

	vec2 polar = cartesian_to_polar(ndc);
	vec3 inverted = stereographic_inverse(polar);

	vec3 cartesian = spherical_to_cartesian(inverted);
	vec3 rotated = rotate_xy(cartesian, rotation);

	return cartesian_to_spherical(rotated);
}

vec3 unproject_inside(vec2 ndc) {
	ndc *= scale_pano(pano_fov);

	// cartesian version:
	vec3 inverted = gnomonic_inverse_cartesian(ndc);

	/* polar version:
	vec2 polar = cartesian_to_polar(ndc);
	vec3 spherical = gnomonic_inverse_spherical(polar);
	inverted = spherical_to_cartesian(spherical);
	*/

	vec3 rotated = rotate_xy(inverted, rotation);
	return cartesian_to_spherical(rotated);
}

void main(void) {
	vec3 lonlat = unproject_hybrid(ndc);
	FragColor = textureLookup(lonlat.xy);
}
`;
