const file = document.querySelector("[type=file]");
const source = document.querySelector("#source img");
const scene = document.querySelector("#target little-planet");
const form = document.querySelector("#options form");

function updateCamera() {
	let camera = {
		hfov: target.querySelector("[name=hfov]").valueAsNumber,
		lon: target.querySelector("[name=lon]").valueAsNumber,
		lat: target.querySelector("[name=lat]").valueAsNumber
	};
	scene.camera = camera;
}

function pair(selector, callback) {
	let node = form.querySelector(selector);
	node.addEventListener("change", e => callback(e.target));
	callback(node);
}

//pair("[name=altitude]", input => scene.altitude = Number(input.value));

source.addEventListener("load", e => scene.src = e.target.src);

scene.addEventListener("load", e => {
	let scene = e.target;
//	scene.width = scene.height = scene.planetSize/4;
	scene.width = scene.planetSize/4;
	scene.height = scene.width * 1;
});

[...target.querySelectorAll("input")].forEach(i => i.addEventListener("input", updateCamera));

file.addEventListener("change", e => {
	let f = e.target.files[0];
	if (!f) { return; }
	source.src = URL.createObjectURL(f);
})

source.src = "sample.jpg"; // demo
//source.src = "sanatorium.jpg"; // demo
//source.src = "world-graticule.png"; // demo
