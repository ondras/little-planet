const UNIFORM_SETTERS = {
	0x8B50: "uniform2fv",
	0x8B51: "uniform3fv",
	0x8B52: "uniform4fv",
	0x8B53: "uniform2iv",
	0x8B54: "uniform3iv",
	0x8B55: "uniform4iv",
	0x8B56: "uniform1i",
	0x8B57: "uniform2iv",
	0x8B58: "uniform3iv",
	0x8B59: "uniform4iv",
	0x8B5A: "uniformMatrix2fv",
	0x8B5B: "uniformMatrix3fv",
	0x8B5C: "uniformMatrix4fv",
	0x8B5E: "uniform1i",
	0x8B60: "uniform1i",
	0x1400: "uniform1i",
	0x1401: "uniform1i",
	0x1402: "uniform1i",
	0x1403: "uniform1i",
	0x1404: "uniform1i",
	0x1405: "uniform1i",
	0x1406: "uniform1f"
};

export default class Program {
	constructor(gl, def) {
		this.gl = gl;
		this.program = compile(gl, def);
		this.uniform = createUniforms(gl, this.program);
		this.attribute = createAttributes(gl, this.program);
	}

	use() {
		const { gl, program } = this;
		gl.useProgram(program);
	}
}

function compile(gl, def) {
	const vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, def.vs);
	gl.compileShader(vs);
	if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(vs)); }

	const fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs, def.fs);
	gl.compileShader(fs);
	if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(fs)); }

	const program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);

	return program;
}

function createAttributes(gl, program) {
	const result = {};

	const count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	for (let i=0;i<count;i++) {
		let obj = createAttribute(gl, program, i);
		result[obj.name] = obj;
	}

	return result;
}

function createUniforms(gl, program) {
	const result = {};

	const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	for (let i=0;i<count;i++) {
		let obj = createUniform(gl, program, i);
		result[obj.name] = obj;
	}

	return result;
}

function createAttribute(gl, program, index) {
	const info = gl.getActiveAttrib(program, index);
	const name = info.name;
	const location = gl.getAttribLocation(program, name);
	return {
		name: info.name,
		location,
		pointer(...args) {
			gl.vertexAttribPointer(location, ...args);
		},
		divisor(...args) {
			gl.vertexAttribDivisor(location, ...args);
		},
		enable() { gl.enableVertexAttribArray(location); }
	}
}

function createUniform(gl, program, index) {
	const info = gl.getActiveUniform(program, index);
	const name = info.name.split("[")[0]; // array uniforms
	const location = gl.getUniformLocation(program, info.name);
	const setter = gl[UNIFORM_SETTERS[info.type]];
	return {
		name,
		location,
		set(...args) { setter.call(gl, location, ...args); }
	}
}
