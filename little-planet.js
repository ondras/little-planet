import Program from "./webgl-program.js";
import { vs, fs } from "./shaders.js";


const RAD = Math.PI / 180;
const QUAD = new Float32Array([1, -1, -1, -1, 1, 1, -1, 1]);
const HFOV_RANGE = [50, 120];
const LAT_RANGE = [-90, 90];
const DEFAULT_PANO_HFOV = (HFOV_RANGE[0]+HFOV_RANGE[1])/2;
const DEFAULT_PLANET_FOV = 240;


function pointerDistance(p1, p2) {
	let dx = p2.x-p1.x;
	let dy = p2.y-p1.y;
	return Math.sqrt(dx**2, dy**2);
}

function createTexture(src, gl) {
	let texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
//	gl.generateMipmap(gl.TEXTURE_2D);
	return texture;
}

function createTextures(img, gl) {
	let tmp = document.createElement("canvas");
	tmp.width = img.naturalWidth/2;
	tmp.height = img.naturalHeight;
	let ctx = tmp.getContext("2d");

	ctx.drawImage(img, 0, 0);
	gl.activeTexture(gl.TEXTURE0);
	createTexture(tmp, gl);

	ctx.drawImage(img, -tmp.width, 0);
	gl.activeTexture(gl.TEXTURE1);
	createTexture(tmp, gl);
}

function loadImage(src) {
	return new Promise((resolve, reject) => {
		let image = new Image();
		image.crossOrigin = "anonymous";
		image.src = src;
		image.onload = e => resolve(e.target);
		image.onerror = reject;
	});
}

function createContext(canvas) {
	const gl = canvas.getContext("webgl2", {preserveDrawingBuffer: true}); // to allow canvas save-as

	let program = new Program(gl, {vs, fs});
	program.use();

	Object.values(program.attribute).forEach(a => a.enable());
	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
	program.attribute.position.pointer(2, gl.FLOAT, false, 0, 0);

	program.uniform.texLeft.set(0);
	program.uniform.texRight.set(1);

	return { gl, program };
}

export default class LittlePlanet extends HTMLElement {
	#dirty = false;
	#image = null;
	#camera = {
		lat: 0,
		lon: 0,
		hfov: DEFAULT_PANO_HFOV
	}
	#pointers = [];
	#originalCamera = null;
	#mode = "planet";

	constructor() {
		super();

		const canvas = document.createElement("canvas");
		const { gl, program } = createContext(canvas);

		this.program = program;
		this.gl = gl;
//		this.inert = false;

		this.addEventListener("pointerdown", e => this.#onPointerDown(e));
		this.addEventListener("pointerup", e => this.#onPointerUp(e));
		this.addEventListener("pointermove", e => this.#onPointerMove(e));
		this.addEventListener("wheel", e => this.#onWheel(e));

	}

	connectedCallback() {
		const { canvas } = this;

		this.append(canvas);

		let options = { // init from attributes
			width: Number(this.getAttribute("width")) || canvas.width,
			height: Number(this.getAttribute("height")) || canvas.height
		}
		if (this.hasAttribute("mode")) { options.mode = this.getAttribute("mode"); }
		if (this.hasAttribute("src")) { options.src = this.getAttribute("src"); }

		Object.assign(this, options);
	}

	get canvas() { return this.gl.canvas; }
	get planetSize() { return this.#image ? 2*this.#image.naturalHeight : null; }

	get inert() { return this.hasAttribute("inert"); }
	set inert(inert) { this.toggleAttribute("inert", inert); }

	get camera() { return this.#camera; }
	set camera(camera) {
		Object.assign(this.#camera, camera);
		this.#camera.hfov = Math.min(Math.max(this.#camera.hfov, HFOV_RANGE[0]), HFOV_RANGE[1]);
		this.#camera.lat = Math.min(Math.max(this.#camera.lat, LAT_RANGE[0]), LAT_RANGE[1]);
		this.#changed();
	}

	get mode() { return this.#mode; }
	set mode(mode) {
		this.#mode = (mode == "pano" ? "pano" : "planet");
		this.#changed();
	}

	get width() { return this.canvas.width; }
	set width(width) {
		this.canvas.width = width;
		this.#syncSize();
	}

	get height() { return this.canvas.height; }
	set height(height) {
		this.canvas.height = height;
		this.#syncSize();
	}

	get src() { return this.#image.src; }
	set src(src) {
		this.#load(src);
	}

	async #load(src) {
		this.#image = null;

		try {
			this.#image = await loadImage(src);
			createTextures(this.#image, this.gl);
			this.#render();
			this.dispatchEvent(new CustomEvent("load"));
		} catch (e) {
			this.dispatchEvent(new CustomEvent("error", {detail:e}));
		}
	}

	#onPointerDown(e) {
		if (this.inert) { return; }

		if (this.#mode == "planet") { return this.#transition(); }

		this.#pointers.push(e);
		if (this.#pointers.length == 1) {
			this.#originalCamera = Object.assign({}, this.#camera);
			this.setPointerCapture(e.pointerId);
		}
	}

	#onPointerUp(e) {
		if (this.inert) { return; }

		if (this.#pointers.length == 1) {
			this.releasePointerCapture(e.pointerId);
		}
		this.#pointers = this.#pointers.filter(pointer => pointer.pointerId != e.pointerId);
	}

	#onPointerMove(e) {
		if (this.inert) { return; }

		const pointers = this.#pointers;
		const anglePerPixel = this.#camera.hfov / this.clientWidth;

		switch (pointers.length) {
			case 2: // zoom/fov
				let oldDist = pointerDistance(pointers[0], pointers[1]);
				pointers.forEach((p, i) => {
					if (p.pointerId == e.pointerId) { pointers[i] = e; }
				});
				let newDist = pointerDistance(pointers[0], pointers[1]);
				let diff = newDist - oldDist;
				this.camera = { hfov: this.#camera.hfov - diff * anglePerPixel };
			break;

			case 1: // pan
				let dx = e.x - this.#pointers[0].x;
				let dy = e.y - this.#pointers[0].y;

				let dlon = dx * anglePerPixel;
				let dlat = dy * anglePerPixel;

				this.camera = {
					lon: this.#originalCamera.lon - dlon,
					lat: this.#originalCamera.lat + dlat
				}
			break;
		}
	}

	#onWheel(e) {
		if (this.#mode == "planet" || this.inert) { return; }

		e.preventDefault();
		let fovDelta = e.deltaY * 0.05;
		this.camera = { hfov: this.#camera.hfov + fovDelta };
	}

	#transition() {
		let oldInert = this.inert;
		this.inert = true;

		const duration = 2000;
		const descendStop = 0.9;
		const rotateStart = 0.6;
		let startTime = performance.now();

		let step = () => {
			let time = performance.now();
			let phase = (time-startTime) / duration;

			let uniforms = {};

			if (phase < descendStop) {
				let frac = phase / descendStop;
				uniforms.planet_pano_mix = frac;
			} else {
				uniforms.planet_pano_mix = 1;
			}

			if (phase < rotateStart) {
				uniforms.rotation = [0, 0];
			} else {
				let frac = (phase-rotateStart)/(1-rotateStart);
				frac = frac*frac;
				uniforms.rotation = [0, frac*90*RAD];
			}

			this.#render(uniforms);
			if (phase < 1) {
				requestAnimationFrame(step);
			} else {
				this.#mode = "pano";
				this.inert = oldInert;
			}
		}

		requestAnimationFrame(step);
	}

	#changed() {
		if (this.#dirty || !this.#image) { return; }
		this.#dirty = true;
		requestAnimationFrame(() => this.#render());
	}

	#syncSize() {
		const { canvas, program, gl } = this;

		let port = [canvas.width, canvas.height];
		gl.viewport(0, 0, ...port);
		program.uniform.port.set(port);
		this.#changed();
	}

	#render(forceUniforms = {}) {
		const { gl, program } = this;

		let planet_pano_mix, rotation;
		if (this.#mode == "planet") {
			planet_pano_mix = 0;
			rotation = [0, 0];
		} else {
			planet_pano_mix = 1;
			rotation = [this.#camera.lon*RAD, (90+this.#camera.lat)*RAD];
		}

		let uniforms = {
			planet_pano_mix,
			rotation,
			pano_hfov: this.#camera.hfov * RAD,
			planet_fov: DEFAULT_PLANET_FOV * RAD
		}
		Object.assign(uniforms, forceUniforms);

		for (let name in uniforms) { program.uniform[name].set(uniforms[name]); }
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		this.#dirty = false;
	}
}

customElements.define("little-planet", LittlePlanet);
