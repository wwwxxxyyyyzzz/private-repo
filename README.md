# 共振野境 RMS

A complete, buildless interactive brand website, using the supplied RMS PDFs and image references. All deployable source is tracked in `dist/`.

## Run locally

```sh
npm run dev
```

Open http://localhost:5173. No npm dependencies or build step are required.

```sh
npm run check
```

Checks JavaScript syntax, local module imports, HTML assets and links.

## Pages

- `index.html`: original homepage, interactive typography, particle dispersion, four-stage sticky narrative, archive and product previews.
- `archive.html`: five species themes, category/search filters, detail dialogs, opt-in synthetic audio demos, seeking, volume, audio-reactive canvas, completed-listening impressions.
- `lab.html`: built-in demos or local MP3/WAV/M4A uploads, Web Audio analysis (RMS, low/mid/high energy and spectral centroid), five live parameters, PDF palette, direct pointer/touch manipulation, fullscreen, PNG, transparent PNG, static SVG, saved impressions.
- `products.html`: the three PDF concept products, interactive function hotspots, subtle pointer parallax, cabin structure illustration, connected experience narrative.
- `about.html`: brand story, design methodology, visual language and practical questions.
- `collection.html`: browser-local sound impressions, restore parameters, download/delete, personal resonance map composition and PNG export.

## Implementation

`data.js` contains species and product editorial data. `audio.js` owns playback, decoding and analysis. `resonance.js` owns particle rendering. `store.js` owns browser-local collections. `ui.js` owns shared navigation and audio controls. Each page has a small dedicated controller. Design tokens live in `style.css`, with page layouts in `full.css`.

Hardware WebGL uses one point-buffer draw per visible field. Software WebGL is detected and uses a bounded Canvas fallback. Geometry is generated when the scene/parameters change rather than re-evaluated per particle each frame. Audio modifies shader uniforms or inexpensive fallback position/size values. Hidden pages pause audio and fields outside the viewport stop rendering. DPR is capped and reduced motion is supported.

Uploads are decoded in the browser; neither audio nor collection data is uploaded. Collections are limited to 24 impressions in localStorage and do not persist the uploaded audio bytes. The site has no account requirement or backend service.

## Source assets and content

All imagery was extracted from the two user-supplied PDFs. No stock or generated replacement photography was added. Source watermarks are preserved. Reference-photo identification and final editorial/source metadata remain replaceable in `data.js`.

All bundled audio is explicitly labeled synthetic demo audio, generated in the browser. It is not presented as an authentic animal recording. Real recordings can be selected using the local-upload controls. Resonance graphics are Chladni-inspired generative art rather than physical simulations or scientific measurement results. Product visuals describe concept designs from the supplied PDFs.

## Verification

Browser checks cover all six desktop and mobile pages, no horizontal overflow, dialogs/navigation, search/filtering, audio playback and completion, uploaded WAV analysis, parameter changes, PNG/transparent PNG/SVG downloads, collection persistence/restoration/deletion, map export, reduced motion and both WebGL and Canvas rendering paths. The original particle performance and stronger pointer dispersion are preserved.
