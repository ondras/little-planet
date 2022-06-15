# &lt;little-planet&gt;

This project is a Custom HTML Element (AKA Web Component) that renders an interactive view of a panoramic photo. Can be used with no JavaScript knowledge: just include the component and continue with plain HTML.

[See it in action](FIXME) or jump straight into the [Documentation]()

## Features

  - Easy to use via the `<little-planet>` HTML tag
  - Rendered via WebGL 2
  - No geometry, just one quad
    - uses the *impostor sphere* technique, ray-tracing the scene in fragment shader
  - Two views: top-level planet-like (not interactive) and a regular interactive inside-the-sphere
  - Smooth transition
  - Needs only one (equirectangular) image, size up to 8192×4096 pixels

## Read more
