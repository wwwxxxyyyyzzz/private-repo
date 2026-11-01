# RMS interaction behavior

## Audio

Nothing autoplays. The global sound control, archive play button or lab play button initiates audio. Bundled sound buffers are clearly labeled synthetic demonstrations. Uploaded audio is decoded locally with Web Audio. Pause, stop, seek and volume operate on the same page-local engine. Navigation stops sound and hiding a page pauses it.

The analyser computes RMS from time-domain samples; frequency bins provide low/mid/high energies and an amplitude-weighted spectral centroid in Hz. Values are actual analysis of the current audio, not invented animal measurements.

## Particle field

Use bounded, precomputed anchor geometry. Hardware WebGL uploads the anchors once and renders points in a single call; audio is applied as uniform modulation. Software WebGL uses a lighter Canvas path. Strong cursor repulsion, grain-dependent displacement and decaying disturbances create scatter/return; pressing increases the influence. Complexity and organic distortion rebuild geometry only when changed. Density, detail and response update without rebuilding.

Only visible fields animate. Hidden documents pause. `prefers-reduced-motion` keeps the visual field static while retaining controls, exports and audio analysis values. No external rendering frameworks are required.

## Archive

Search and category filters operate together. Hover never plays sound. Each entry opens a detail dialog or explicitly starts playback. Completing playback unlocks a collectible impression.

## Lab

Select a demo, or upload/drop a supported local audio file. Play initiates analysis. Six sliders adjust node complexity, organic distortion, grain density, grain detail, flow speed and audio response. The pattern flows continuously before audio is loaded. A separate pause/resume button freezes the flow clock; audio playback remains separately controlled. The five PDF palette colors are selectable. Pointer/touch manipulation and double-click pulse act on the canvas. PNG exports can include the background or transparency; SVG exports a static snapshot of the current flow phase with current density/detail/color. Exports exclude all website UI.

## Products

Numbered hotspots update the nearby labeled function description. All points are buttons with expanded state and an associated information region. Pointer parallax is subtle and disabled for coarse pointers or reduced motion. Product chapters reveal once as they enter view.

## Collection

Impressions contain source label, timestamp, visual snapshot and render settings. They live in localStorage (maximum 24); audio files are not persisted. Entries can restore their settings in the lab, download their snapshot or be removed after confirmation. A composed personal resonance map is exportable as PNG. The empty state links directly into the lab.

## Navigation

All six pages are actual static HTML documents with direct URLs. Mobile navigation supports keyboard Escape. Native view transitions reveal incoming pages when supported; reduced motion uses instant navigation.

## GSAP, Lenis and fine-grain rendering

GSAP 3.15.0 with SplitText and ScrollTrigger drives the hero entrance, section-line reveals, story-text changes and small navigation/button feedback. The hero lettering then uses cached solid, outline, blur and grain layers in `typography.js` for a repeating material transition; it is not split into per-character DOM animations. Content exists as readable HTML and is not gated behind a loading screen. Font readiness precedes splitting, splits are reverted on reduced-motion changes, and animations clean up on navigation.

Lenis 1.3.27 is driven by a single named GSAP ticker callback; `autoRaf` is false. Touch keeps native scrolling, anchors use the same scroll driver, dialogs retain native inner scrolling, and the library's reduced-motion handling is enabled. Browser-back restoration restarts the existing instance rather than creating a second driver.

Hardware WebGL draws precomputed anchors with a seeded grain atlas in one call and applies coherent two-axis flow in the vertex shader. The Canvas fallback caches the dense grain texture, warps it through two strip passes, and blends neighboring cached phase frames. Lab and homepage preview fields flow without audio; other Canvas fields stop scheduling when idle. Pointer scatter remains bounded. Both renderers retain audio modulation, export and all controls. Offscreen/hidden fields stop scheduling; reduced motion freezes the material.

Validation covered 360, 390, 768 and 1440 px, complete archive/upload/export/collection workflows, anchors and story steps, reduced motion, real font loading and full headline bounds. Current-flow checks additionally cover no-audio motion, stable pause, flow-speed control, animated font layers and a static reduced-motion fallback. On this software-rendered test environment, combined flow, audio and pointer scatter measured 16.6 ms median / 21.9 ms p95 frame intervals. Device performance varies.
