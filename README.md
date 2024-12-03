# &lt;little-planet&gt;

This project is a [Custom HTML Element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) (AKA [Web Component](https://developer.mozilla.org/en-US/docs/Web/Web_Components)) that renders an interactive view of a panoramic photo. Can be used with no JavaScript knowledge: just include the component and continue with plain HTML.

[See it in action](https://ondras.github.io/little-planet/showcase.html) or jump straight into the [Documentation](https://github.com/ondras/little-planet/wiki)

## Features

  - Easy to use via the `<little-planet>` HTML tag
  - Rendered via WebGL 2
  - No geometry, just one quad
    - uses the *impostor sphere* technique, ray-tracing the scene in fragment shader
  - Two views: top-level planet-like (not interactive) and a regular interactive inside-the-sphere
  - Smooth transition (both ways: double-click/tap to zoom back)
  - Controllable via mouse or touch, mobile friendly
  - Needs only one (equirectangular) image, size up to 8192×4096 pixels

## Read more

  - [Showcase of most features](https://ondras.github.io/little-planet/showcase.html)
  - [Little Planet Creator](https://ondras.github.io/little-planet/little-planet.html)
  - [Sizes & Resolutions](https://ondras.github.io/little-planet/sizes-resolutions.html)
  - [Fullscreen viewer](https://ondras.github.io/little-planet/fullscreen.html)

## Miscellaneous

  - [Author](https://ondras.zarovi.cz/)
  - [Sponsor me!](https://github.com/sponsors/ondras)
  - [NPM package](https://www.npmjs.com/package/little-planet)

## Changelog

  - 0.6.x: reset on src change, support for :state, change event
  - 0.5.x: FOV for the longer side
  - 0.4.x: `static` instead of `inert`
  - 0.3.x: shadow DOM
  - 0.2.x: reverse transition support
  - 0.1.x: initial release
